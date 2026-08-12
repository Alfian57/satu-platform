<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Actions\Audit\AuditRecorder;
use App\Events\WorkspaceTaskChanged;
use App\Models\Institution;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class DeleteTask
{
    public function __construct(
        private readonly AuditRecorder $audit,
    ) {}

    public function handle(User $actor, Task $task): void
    {
        Gate::forUser($actor)->authorize('delete', $task);

        DB::transaction(function () use ($actor, $task): void {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($task->project_id)
                ->firstOrFail();
            $lockedTask = Task::query()
                ->lockForUpdate()
                ->whereKey($task->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('delete', $lockedTask);

            $this->audit->record(
                operation: 'task.deleted',
                auditable: $lockedTask,
                actor: $actor,
                institution: Institution::query()->findOrFail($lockedProject->institution_id),
                before: [
                    'task_id' => $lockedTask->getKey(),
                    'project_id' => $lockedTask->project_id,
                    'status' => $lockedTask->status->value,
                ],
            );

            $lockedTask->delete();

            WorkspaceTaskChanged::dispatch(
                institutionId: (int) $lockedProject->institution_id,
                projectId: (int) $lockedProject->getKey(),
                resourceId: (int) $lockedTask->getKey(),
                operation: 'task.deleted',
                version: null,
                occurredAt: now()->toIso8601String(),
            );
        }, attempts: 3);
    }
}
