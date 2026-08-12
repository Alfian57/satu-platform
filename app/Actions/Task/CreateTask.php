<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Actions\Audit\AuditRecorder;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Events\WorkspaceTaskChanged;
use App\Models\Institution;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class CreateTask
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly TaskRequirements $requirements,
    ) {}

    /**
     * Create a task in an active project workspace.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, Project $project, array $data): Task
    {
        Gate::forUser($actor)->authorize('create', [Task::class, $project]);

        return DB::transaction(function () use ($actor, $project, $data): Task {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($project->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('create', [Task::class, $lockedProject]);

            $task = Task::query()->forceCreate([
                'project_id' => $lockedProject->getKey(),
                'created_by_id' => $actor->getKey(),
                'title' => $this->requirements->requiredText(
                    $data['title'] ?? null,
                    'title',
                    160,
                ),
                'description' => $this->requirements->nullableText(
                    $data['description'] ?? null,
                    'description',
                    5000,
                ),
                'status' => TaskStatus::Todo,
                'priority' => $this->requirements->priority(
                    $data['priority'] ?? TaskPriority::Medium,
                ),
                'due_at' => $this->requirements->dueAt(
                    $this->requirements->dueAtInput($data),
                    $lockedProject,
                ),
            ]);

            $this->audit->record(
                operation: 'task.created',
                auditable: $task,
                actor: $actor,
                institution: Institution::query()->findOrFail($lockedProject->institution_id),
                after: $this->summary($task),
            );

            WorkspaceTaskChanged::dispatch(
                institutionId: (int) $lockedProject->institution_id,
                projectId: (int) $lockedProject->getKey(),
                resourceId: (int) $task->getKey(),
                operation: 'task.created',
                version: $task->updated_at->toIso8601String(),
                occurredAt: now()->toIso8601String(),
            );

            return $task->refresh()->load(['project', 'createdBy', 'assignments.assignee']);
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
