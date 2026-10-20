<?php

namespace App\Actions\OpportunitySupport;

use App\Actions\Audit\AuditRecorder;
use App\Actions\Consent\ConsentRecorder;
use App\Http\Requests\OpportunitySupport\StoreOpportunitySupportRequest;
use App\Http\Requests\OpportunitySupport\TransitionOpportunitySupportRequest;
use App\Models\Institution;
use App\Models\OpportunitySupportEvent;
use App\Models\OpportunitySupportRequest;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\TeamMembership;
use App\Models\User;
use App\Support\OpportunitySupportGovernance;
use App\Support\Project\ProjectOpportunityCapacity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class ManageOpportunitySupport
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly ConsentRecorder $consents,
        private readonly OpportunitySupportGovernance $governance,
    ) {}

    /** @param array<string, mixed> $data */
    public function create(User $actor, Institution $institution, array $data): OpportunitySupportRequest
    {
        Gate::forUser($actor)->authorize('create', [OpportunitySupportRequest::class, $institution]);
        $data = Validator::make($data, StoreOpportunitySupportRequest::commandRules())->validate();
        $data['command_key'] = strtolower($data['command_key']);

        return DB::transaction(function () use ($actor, $institution, $data): OpportunitySupportRequest {
            User::query()->whereKey($actor->getKey())->lockForUpdate()->firstOrFail();
            Gate::forUser($actor)->authorize('create', [OpportunitySupportRequest::class, $institution]);
            $settings = $this->governance->settings($institution);
            if ($data['notice_version'] !== $settings['notice_version']) {
                throw new ConflictHttpException('Pemberitahuan berubah. Baca ulang sebelum mengizinkan.');
            }
            $existing = OpportunitySupportRequest::query()->where('institution_id', $institution->getKey())
                ->where('owner_id', $actor->getKey())->where('command_key', $data['command_key'])->first();
            $explanation = trim((string) ($data['explanation'] ?? '')) ?: null;
            if ($existing !== null) {
                if ($existing->need !== $data['need'] || $existing->explanation !== $explanation || $existing->notice_version !== $data['notice_version']) {
                    throw new ConflictHttpException('Kunci pengajuan telah dipakai untuk isi berbeda.');
                }

                return $existing;
            }
            $request = OpportunitySupportRequest::query()->forceCreate([
                'institution_id' => $institution->getKey(), 'owner_id' => $actor->getKey(),
                'command_key' => $data['command_key'], 'need' => $data['need'], 'explanation' => $explanation,
                'purpose' => $settings['purpose'], 'notice_version' => $settings['notice_version'],
                'consent_purpose' => 'opportunity.support.'.$institution->getKey().'.'.$actor->getKey().'.'.$data['command_key'],
                'approval_reference' => $settings['approval_reference'], 'dataset_kind' => $settings['dataset_kind'],
                'dataset_manifest' => $settings['dataset_manifest'], 'expires_at' => now()->addDays($settings['access_days']),
            ]);
            $this->consents->grant($actor, $request->consentPurpose(), $request->notice_version, 'opportunity.support');
            $this->append($request, $actor, 'requested');

            return $request;
        }, attempts: 3);
    }

    /** @param array<string, mixed> $data */
    public function transition(User $actor, OpportunitySupportRequest $source, array $data): OpportunitySupportRequest
    {
        $data = Validator::make($data, TransitionOpportunitySupportRequest::commandRules())->validate();
        if ($source->isDirty(['id', 'owner_id', 'institution_id'])) {
            abort(403);
        }
        Gate::forUser($actor)->authorize(match ($data['action']) {
            'withdraw' => 'withdraw',
            'accept', 'decline' => 'respond',
            default => 'review',
        }, $source);

        return DB::transaction(function () use ($actor, $source, $data): OpportunitySupportRequest {
            $persisted = OpportunitySupportRequest::query()->whereKey($source->getKey())->firstOrFail();
            User::query()->whereKey($persisted->owner_id)->lockForUpdate()->firstOrFail();
            $role = null;
            if ($data['action'] === 'offer') {
                $role = ProjectRole::query()->whereKey((int) $data['project_role_id'])
                    ->whereHas('project', fn (Builder $q) => $q->where('institution_id', $persisted->institution_id))->first();
                if ($role === null) {
                    throw ValidationException::withMessages(['project_role_id' => 'Peran tidak tersedia pada kampus ini. Pilih peluang lain.']);
                }
            } elseif ($data['action'] === 'accept') {
                $role = $persisted->events()->where('action', 'offer')->latest('id')->first()?->projectRole;
            }
            if ($role !== null) {
                Project::query()->whereKey($role->project_id)->lockForUpdate()->firstOrFail();
                $role->refresh();
            }
            $request = OpportunitySupportRequest::query()->whereKey($source->getKey())->lockForUpdate()->firstOrFail();
            $ability = match ($data['action']) {
                'withdraw' => 'withdraw',
                'accept', 'decline' => 'respond',
                default => 'review',
            };
            Gate::forUser($actor)->authorize($ability, $request);
            if ($request->revision !== (int) $data['expected_revision']) {
                throw new ConflictHttpException('Permintaan berubah. Periksa data terbaru sebelum melanjutkan.');
            }
            $action = $data['action'];
            $reason = trim((string) ($data['reason'] ?? '')) ?: null;
            if (in_array($action, ['offer', 'note'], true) && $reason === null) {
                throw ValidationException::withMessages(['reason' => 'Jelaskan alasan tindak lanjut.']);
            }
            if ($action === 'offer') {
                if (! in_array($request->status, ['requested', 'declined'], true) || $role === null) {
                    throw new ConflictHttpException('Tawaran tidak tersedia untuk keadaan ini.');
                }
                $this->ensureOpportunity($request, $role);
                $request->status = 'offered';
            } elseif (in_array($action, ['accept', 'decline'], true)) {
                if ($request->status !== 'offered') {
                    throw new ConflictHttpException('Tawaran sudah berubah.');
                }
                if ($action === 'accept') {
                    if ($role === null) {
                        throw new ConflictHttpException('Peran tidak lagi tersedia.');
                    }
                    $this->ensureOpportunity($request, $role);
                }
                $request->status = $action === 'accept' ? 'accepted' : 'declined';
            } elseif ($action === 'withdraw') {
                if ($this->consents->current($request->owner, $request->consentPurpose())?->isGrant()) {
                    $this->consents->withdraw($request->owner, $request->consentPurpose(), $request->notice_version, 'opportunity.support');
                }
                $request->status = 'withdrawn';
            } elseif ($action === 'note' && ! in_array($request->status, ['requested', 'offered', 'accepted', 'declined'], true)) {
                throw new ConflictHttpException('Berkas tidak lagi dapat ditindaklanjuti.');
            }
            $request->revision++;
            $request->save();
            $this->append($request, $actor, $action, $reason, $action === 'offer' ? $role : null);

            return $request;
        }, attempts: 3);
    }

    private function ensureOpportunity(OpportunitySupportRequest $request, ProjectRole $role): void
    {
        $project = $role->project;
        if ($project->institution_id !== $request->institution_id
            || ($request->need === 'beginner_path' && $role->accepts_beginners !== true)
            || TeamMembership::query()->where('project_id', $project->getKey())->where('user_id', $request->owner_id)->where('status', 'active')->exists()
            || ! Gate::forUser($request->owner)->allows('requestJoin', $project)
            || ! ProjectOpportunityCapacity::role($role, $project)['accepting']) {
            throw ValidationException::withMessages(['project_role_id' => 'Peluang tidak lagi tersedia atau tidak dapat diajukan. Pilih peluang lain.']);
        }
    }

    private function append(OpportunitySupportRequest $request, User $actor, string $action, ?string $reason = null, ?ProjectRole $role = null): void
    {
        OpportunitySupportEvent::query()->forceCreate([
            'opportunity_support_request_id' => $request->getKey(), 'actor_id' => $actor->getKey(),
            'action' => $action, 'reason' => $reason, 'project_role_id' => $role?->getKey(),
            'revision' => $request->revision, 'created_at' => now(),
        ]);
        $this->audit->record(
            operation: 'opportunity.support.'.$action, auditable: $request, actor: $actor,
            institution: $request->institution, after: ['status' => $request->status, 'revision' => $request->revision, 'project_role_id' => $role?->getKey()],
        );
    }
}
