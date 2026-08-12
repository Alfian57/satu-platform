<?php

declare(strict_types=1);

namespace App\Support\Task;

use App\Models\Project;
use App\Models\Task;
use App\Models\TaskAssignment;
use Illuminate\Pagination\LengthAwarePaginator;

final class TaskWorkspaceSerializer
{
    /**
     * @param  LengthAwarePaginator<int, Task>  $paginator
     * @return array<string, mixed>
     */
    public function page(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => array_map(
                fn (Task $task): array => $this->task($task),
                $paginator->items(),
            ),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function project(Project $project): array
    {
        $project->loadMissing('owner:id,name');

        return [
            'id' => $project->getKey(),
            'title' => $project->title,
            'status' => $project->status->value,
            'deadline' => $project->deadline->toIso8601String(),
            'owner' => [
                'id' => $project->owner->getKey(),
                'name' => $project->owner->name,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function task(Task $task): array
    {
        $task->loadMissing([
            'createdBy:id,name',
            'assignments.assignee:id,name',
        ]);

        return [
            'id' => $task->getKey(),
            'title' => $task->title,
            'description' => $task->description,
            'status' => $task->status->value,
            'priority' => $task->priority->value,
            'due_at' => $task->due_at?->toIso8601String(),
            'is_overdue' => $task->isOverdue(),
            'created_by' => [
                'id' => $task->createdBy->getKey(),
                'name' => $task->createdBy->name,
            ],
            'assignments' => $task->assignments
                ->map(fn (TaskAssignment $assignment): array => [
                    'id' => $assignment->getKey(),
                    'user' => [
                        'id' => $assignment->assignee->getKey(),
                        'name' => $assignment->assignee->name,
                    ],
                ])
                ->values()
                ->all(),
            'created_at' => $task->created_at->toIso8601String(),
            'updated_at' => $task->updated_at->toIso8601String(),
        ];
    }
}
