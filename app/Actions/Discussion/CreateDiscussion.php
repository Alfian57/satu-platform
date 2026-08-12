<?php

declare(strict_types=1);

namespace App\Actions\Discussion;

use App\Actions\Audit\AuditRecorder;
use App\Models\Institution;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

final class CreateDiscussion
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly DiscussionRequirements $requirements,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, Project $project, array $data): Message
    {
        Gate::forUser($actor)->authorize('create', [Message::class, $project]);

        return DB::transaction(function () use ($actor, $project, $data): Message {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($project->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('create', [Message::class, $lockedProject]);

            $message = Message::query()->forceCreate([
                'project_id' => $lockedProject->getKey(),
                'author_id' => $actor->getKey(),
                'body' => $this->requirements->body($data['body'] ?? null),
            ]);

            $this->audit->record(
                operation: 'discussion.created',
                auditable: $message,
                actor: $actor,
                institution: Institution::query()->findOrFail($lockedProject->institution_id),
                after: $this->summary($message),
            );

            return $message->refresh()->load(['project', 'author']);
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
