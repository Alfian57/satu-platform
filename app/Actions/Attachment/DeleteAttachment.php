<?php

declare(strict_types=1);

namespace App\Actions\Attachment;

use App\Actions\Audit\AuditRecorder;
use App\Events\WorkspaceDiscussionChanged;
use App\Models\Attachment;
use App\Models\Institution;
use App\Models\Project;
use App\Models\User;
use App\Support\Attachment\AttachmentStorage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class DeleteAttachment
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly AttachmentStorage $storage,
    ) {}

    public function handle(User $actor, Attachment $attachment): void
    {
        Gate::forUser($actor)->authorize('delete', $attachment);

        DB::transaction(function () use ($actor, $attachment): void {
            $lockedAttachment = Attachment::query()
                ->whereKey($attachment->getKey())
                ->lockForUpdate()
                ->firstOrFail();
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($lockedAttachment->project_id)
                ->firstOrFail();

            Gate::forUser($actor)->authorize('delete', $lockedAttachment->load('project'));

            $this->audit->record(
                operation: 'attachment.deleted',
                auditable: $lockedAttachment,
                actor: $actor,
                institution: Institution::query()->findOrFail($lockedProject->institution_id),
                before: $this->summary($lockedAttachment),
            );

            $attachmentForCleanup = $lockedAttachment->load('project');

            DB::afterCommit(function () use ($attachmentForCleanup): void {
                $this->storage->delete($attachmentForCleanup);
            });

            $lockedAttachment->delete();

            if ($lockedAttachment->message_id !== null) {
                WorkspaceDiscussionChanged::dispatch(
                    institutionId: (int) $lockedProject->institution_id,
                    projectId: (int) $lockedProject->getKey(),
                    resourceId: (int) $lockedAttachment->message_id,
                    operation: 'discussion.attachment.deleted',
                    version: null,
                    occurredAt: now()->toIso8601String(),
                );
            }
        }, attempts: 3);
    }

    /**
     * @return array{attachment_id: int, project_id: int, message_id: int|null, purpose: string, mime_type: string, size_bytes: int}
     */
    private function summary(Attachment $attachment): array
    {
        return [
            'attachment_id' => $attachment->getKey(),
            'project_id' => $attachment->project_id,
            'message_id' => $attachment->message_id,
            'purpose' => $attachment->purpose->value,
            'mime_type' => $attachment->mime_type,
            'size_bytes' => $attachment->size_bytes,
        ];
    }
}
