<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Actions\Audit\AuditRecorder;
use App\Models\Institution;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class UnassignTask
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(User $actor, Task $task, User $assignee): ?TaskAssignment
    {
        Gate::forUser($actor)->authorize('unassign', $task);

        return DB::transaction(function () use ($actor, $task, $assignee): ?TaskAssignment {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($task->project_id)
                ->firstOrFail();
            $lockedTask = Task::query()
                ->lockForUpdate()
                ->whereKey($task->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('unassign', $lockedTask);

            $assignment = TaskAssignment::query()
                ->lockForUpdate()
                ->where('task_id', $lockedTask->getKey())
                ->where('user_id', $assignee->getKey())
                ->first();

            if ($assignment === null) {
                return null;
            }

            $this->audit->record(
                operation: 'task.unassigned',
                auditable: $assignment,
                actor: $actor,
                institution: Institution::query()->findOrFail($lockedProject->institution_id),
                before: [
                    'assignment_id' => $assignment->getKey(),
                    'task_id' => $lockedTask->getKey(),
                    'user_id' => $assignment->user_id,
                ],
                after: [
                    'assignment_id' => $assignment->getKey(),
                    'task_id' => $lockedTask->getKey(),
                    'user_id' => $assignment->user_id,
                    'assigned' => false,
                ],
            );

            $assignment->delete();

            return $assignment;
        }, attempts: 3);
    }
}
