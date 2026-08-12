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

final class UpdateDiscussion
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly DiscussionRequirements $requirements,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, Message $message, array $data): Message
    {
        Gate::forUser($actor)->authorize('update', $message);

        return DB::transaction(function () use ($actor, $message, $data): Message {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($message->project_id)
                ->firstOrFail();
            $lockedMessage = Message::query()
                ->lockForUpdate()
                ->where('project_id', $lockedProject->getKey())
                ->whereKey($message->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('update', $lockedMessage);

            $before = $this->summary($lockedMessage);
            $lockedMessage->body = $this->requirements->body($data['body'] ?? null);

            if ($lockedMessage->isDirty()) {
                $lockedMessage->save();

                $this->audit->record(
                    operation: 'discussion.updated',
                    auditable: $lockedMessage,
                    actor: $actor,
                    institution: Institution::query()->findOrFail($lockedProject->institution_id),
                    before: $before,
                    after: $this->summary($lockedMessage),
                );

                WorkspaceDiscussionChanged::dispatch(
                    institutionId: (int) $lockedProject->institution_id,
                    projectId: (int) $lockedProject->getKey(),
                    resourceId: (int) $lockedMessage->getKey(),
                    operation: 'discussion.updated',
                    version: $lockedMessage->updated_at->toIso8601String(),
                    occurredAt: now()->toIso8601String(),
                );
            }

            return $lockedMessage->refresh()->load(['project', 'author']);
        }, attempts: 3);
    }

    /**
     * @return array{message_id: int, project_id: int, body_length: int}
     */
    private function summary(Message $message): array
    {
        return [
            'message_id' => $message->getKey(),
            'project_id' => $message->project_id,
            'body_length' => Str::length($message->body),
        ];
    }
}
