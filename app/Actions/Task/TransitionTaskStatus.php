<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TaskStatus;
use App\Events\WorkspaceTaskChanged;
use App\Exceptions\InvalidTaskTransition;
use App\Models\Institution;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Support\Task\TaskSnapshot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class TransitionTaskStatus
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(
        User $actor,
        Task $task,
        TaskStatus $targetStatus,
        string $expectedRevision,
    ): Task {
        Gate::forUser($actor)->authorize('transition', $task);

        return DB::transaction(function () use ($actor, $task, $targetStatus, $expectedRevision): Task {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($task->project_id)
                ->firstOrFail();
            $lockedTask = Task::query()
                ->lockForUpdate()
                ->whereKey($task->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('transition', $lockedTask);
            TaskSnapshot::ensureFresh($lockedTask, $expectedRevision);

            if ($lockedTask->status === $targetStatus) {
                return $lockedTask->refresh();
            }

            if (! $lockedTask->status->canTransitionTo($targetStatus)) {
                throw new InvalidTaskTransition(
                    "Task tidak dapat berpindah dari {$lockedTask->status->value} ke {$targetStatus->value}.",
                );
            }

            $before = $this->summary($lockedTask);
            $lockedTask->forceFill(['status' => $targetStatus])->save();

            $this->audit->record(
                operation: 'task.status_changed',
                auditable: $lockedTask,
                actor: $actor,
                institution: Institution::query()->findOrFail($lockedProject->institution_id),
                before: $before,
                after: $this->summary($lockedTask),
            );

            WorkspaceTaskChanged::dispatch(
                institutionId: (int) $lockedProject->institution_id,
                projectId: (int) $lockedProject->getKey(),
                resourceId: (int) $lockedTask->getKey(),
                operation: 'task.status_changed',
                version: TaskSnapshot::revision($lockedTask),
                occurredAt: now()->toISOString(),
            );

            return $lockedTask->refresh();
        }, attempts: 3);
    }

    /**
     * @return array{task_id: int, project_id: int, status: string, priority: string, due_at: string|null}
     */
    private function summary(Task $task): array
    {
        return [
            'task_id' => $task->getKey(),
            'project_id' => $task->project_id,
            'status' => $task->status->value,
            'priority' => $task->priority->value,
            'due_at' => $task->due_at?->toIso8601String(),
        ];
    }
}
