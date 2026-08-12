<?php

declare(strict_types=1);

namespace App\Actions\Discussion;

use App\Actions\Audit\AuditRecorder;
use App\Events\WorkspaceDiscussionChanged;
use App\Models\Institution;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

final class DeleteDiscussion
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(User $actor, Message $message): void
    {
        Gate::forUser($actor)->authorize('delete', $message);

        DB::transaction(function () use ($actor, $message): void {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($message->project_id)
                ->firstOrFail();
            $lockedMessage = Message::query()
                ->lockForUpdate()
                ->where('project_id', $lockedProject->getKey())
                ->whereKey($message->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('delete', $lockedMessage);

            $this->audit->record(
                operation: 'discussion.deleted',
                auditable: $lockedMessage,
                actor: $actor,
                institution: Institution::query()->findOrFail($lockedProject->institution_id),
                before: [
                    'message_id' => $lockedMessage->getKey(),
                    'project_id' => $lockedMessage->project_id,
                    'body_length' => Str::length($lockedMessage->body),
                ],
            );

            $lockedMessage->delete();

            WorkspaceDiscussionChanged::dispatch(
                institutionId: (int) $lockedProject->institution_id,
                projectId: (int) $lockedProject->getKey(),
                resourceId: (int) $lockedMessage->getKey(),
                operation: 'discussion.deleted',
                version: null,
                occurredAt: now()->toIso8601String(),
            );
        }, attempts: 3);
    }
}
