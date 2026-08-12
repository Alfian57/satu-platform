<?php

declare(strict_types=1);

namespace App\Actions\Contribution;

use App\Actions\Audit\AuditRecorder;
use App\Enums\AttachmentPurpose;
use App\Enums\ContributionStatus;
use App\Exceptions\InvalidContributionTransition;
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

final class ReviseContribution
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly ContributionRequirements $requirements,
    ) {}

    /**
     * Append a new draft version while preserving all prior provenance.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, Contribution $contribution, array $data): Contribution
    {
        Gate::forUser($actor)->authorize('update', $contribution);

        return DB::transaction(function () use ($actor, $contribution, $data): Contribution {
            $lockedContribution = Contribution::query()
                ->lockForUpdate()
                ->whereKey($contribution->getKey())
                ->firstOrFail();

            $lockedContribution->load([
                'currentVersion.evidence.attachment',
                'project',
            ]);
            Gate::forUser($actor)->authorize('update', $lockedContribution);

            if (! $lockedContribution->canCreateVersion()) {
                throw new InvalidContributionTransition(
                    'Contribution hanya dapat direvisi saat berstatus draft atau revision.',
                );
            }

            $previousVersion = $lockedContribution->currentVersion;

            if ($previousVersion === null) {
                throw new InvalidContributionTransition(
                    'Contribution harus memiliki current version sebelum direvisi.',
                );
            }

            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($lockedContribution->project_id)
                ->firstOrFail();
            $institution = Institution::query()
                ->whereKey($lockedContribution->institution_id)
                ->firstOrFail();

            $taskId = array_key_exists('task_id', $data)
                ? $this->requirements->taskId($data['task_id'], $lockedProject)
                : $previousVersion->task_id;
            $claim = array_key_exists('claim', $data)
                ? $this->requirements->claim($data['claim'])
                : $previousVersion->claim;
            $summary = array_key_exists('summary', $data)
                ? $this->requirements->summary($data['summary'])
                : $previousVersion->summary;
            $declaration = array_key_exists('declaration', $data)
                ? $this->requirements->declaration($data['declaration'])
                : $previousVersion->declaration;
            $newEvidenceIds = array_key_exists('evidence', $data)
                ? $this->requirements->evidenceIds($data['evidence'], $lockedProject)
                : [];

            $task = Task::query()
                ->lockForUpdate()
                ->whereKey($taskId)
                ->whereBelongsTo($lockedProject)
                ->first();

            if ($task === null) {
                throw ValidationException::withMessages([
                    'task_id' => 'Task harus berasal dari project yang sama.',
                ]);
            }

            $newAttachments = $this->lockEvidence($lockedProject, $newEvidenceIds);

            if ($newAttachments->count() !== count($newEvidenceIds)) {
                throw ValidationException::withMessages([
                    'evidence' => 'Sebagian evidence tidak tersedia atau sudah dihapus.',
                ]);
            }

            $previousAttachments = $previousVersion->evidence
                ->map(fn (ContributionEvidence $evidence): ?Attachment => $evidence->attachment)
                ->filter()
                ->keyBy(fn (Attachment $attachment): int => $attachment->getKey());
            $attachments = $previousAttachments
                ->merge($newAttachments)
                ->unique(fn (Attachment $attachment): int => $attachment->getKey())
                ->values();
            $versionNumber = ((int) ContributionVersion::query()
                ->where('contribution_id', $lockedContribution->getKey())
                ->lockForUpdate()
                ->max('version_number')) + 1;
            $beforeStatus = $lockedContribution->status->value;

            $version = ContributionVersion::query()->forceCreate([
                'contribution_id' => $lockedContribution->getKey(),
                'created_by_id' => $actor->getKey(),
                'task_id' => $task->getKey(),
                'version_number' => $versionNumber,
                'claim' => $claim,
                'summary' => $summary,
                'declaration' => $declaration,
            ]);

            $this->attachEvidence($version, $attachments);

            $lockedContribution->forceFill([
                'status' => ContributionStatus::Draft,
                'current_version_id' => $version->getKey(),
            ])->save();

            $this->audit->record(
                operation: 'contribution.revised',
                auditable: $lockedContribution,
                actor: $actor,
                institution: $institution,
                before: [
                    'status' => $beforeStatus,
                    'version_number' => $previousVersion->version_number,
                ],
                after: [
                    'status' => $lockedContribution->status->value,
                    'version_number' => $version->version_number,
                    'evidence_count' => $attachments->count(),
                ],
            );

            return $lockedContribution->refresh()->load([
                'institution',
                'owner',
                'project',
                'currentVersion.task',
                'currentVersion.evidence.attachment',
                'versions',
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
