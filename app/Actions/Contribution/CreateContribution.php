<?php

declare(strict_types=1);

namespace App\Actions\Contribution;

use App\Actions\Audit\AuditRecorder;
use App\Enums\AttachmentPurpose;
use App\Enums\ContributionStatus;
use App\Models\Attachment;
use App\Models\Contribution;
use App\Models\ContributionEvidence;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class CreateContribution
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly ContributionRequirements $requirements,
    ) {}

    /**
     * Create the first immutable contribution version in a project workspace.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, Project $project, array $data): Contribution
    {
        Gate::forUser($actor)->authorize('create', [Contribution::class, $project]);

        return DB::transaction(function () use ($actor, $project, $data): Contribution {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($project->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('create', [Contribution::class, $lockedProject]);

            $taskId = $this->requirements->taskId($data['task_id'] ?? null, $lockedProject);
            $claim = $this->requirements->claim($data['claim'] ?? null);
            $summary = $this->requirements->summary($data['summary'] ?? null);
            $declaration = $this->requirements->declaration($data['declaration'] ?? null);
            $evidenceIds = $this->requirements->evidenceIds($data['evidence'] ?? null, $lockedProject);

            $task = Task::query()
                ->lockForUpdate()
                ->whereKey($taskId)
                ->whereBelongsTo($lockedProject)
                ->firstOrFail();
            $attachments = $this->lockEvidence($lockedProject, $evidenceIds);

            if ($attachments->count() !== count($evidenceIds)) {
                throw ValidationException::withMessages([
                    'evidence' => 'Sebagian evidence tidak tersedia atau sudah dihapus.',
                ]);
            }

            $institution = Institution::query()
                ->whereKey($lockedProject->institution_id)
                ->firstOrFail();

            $contribution = Contribution::query()->forceCreate([
                'institution_id' => $institution->getKey(),
                'owner_id' => $actor->getKey(),
                'project_id' => $lockedProject->getKey(),
                'status' => ContributionStatus::Draft,
                'current_version_id' => null,
            ]);

            $version = ContributionVersion::query()->forceCreate([
                'contribution_id' => $contribution->getKey(),
                'created_by_id' => $actor->getKey(),
                'task_id' => $task->getKey(),
                'version_number' => 1,
                'claim' => $claim,
                'summary' => $summary,
                'declaration' => $declaration,
            ]);

            $this->attachEvidence($version, $attachments);

            $contribution->forceFill([
                'current_version_id' => $version->getKey(),
            ])->save();

            $this->audit->record(
                operation: 'contribution.created',
                auditable: $contribution,
                actor: $actor,
                institution: $institution,
                after: [
                    'contribution_id' => $contribution->getKey(),
                    'project_id' => $lockedProject->getKey(),
                    'version_number' => $version->version_number,
                    'evidence_count' => $attachments->count(),
                    'status' => $contribution->status->value,
                ],
            );

            return $contribution->refresh()->load([
                'institution',
                'owner',
                'project',
                'currentVersion.task',
                'currentVersion.evidence.attachment',
            ]);
        }, attempts: 3);
    }

    /**
     * @param  list<int>  $attachmentIds
     * @return Collection<int, Attachment>
     */
    private function lockEvidence(Project $project, array $attachmentIds): Collection
    {
        if ($attachmentIds === []) {
            return collect();
        }

        return Attachment::query()
            ->whereIn('id', $attachmentIds)
            ->whereBelongsTo($project)
            ->where('purpose', AttachmentPurpose::Evidence)
            ->lockForUpdate()
            ->get()
            ->keyBy(fn (Attachment $attachment): int => $attachment->getKey());
    }

    /**
     * @param  Collection<int, Attachment>  $attachments
     */
    private function attachEvidence(ContributionVersion $version, Collection $attachments): void
    {
        foreach ($attachments as $attachment) {
            ContributionEvidence::query()->forceCreate([
                'contribution_version_id' => $version->getKey(),
                'attachment_id' => $attachment->getKey(),
                'source_label' => $attachment->original_name,
                'notes' => null,
            ]);
        }
    }
}
