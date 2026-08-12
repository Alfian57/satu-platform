<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Actions\Audit\AuditRecorder;
use App\Models\Institution;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Throwable;

final class UpdateTask
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly TaskRequirements $requirements,
    ) {}

    /**
     * Update task metadata. Status changes use TransitionTaskStatus.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, Task $task, array $data): Task
    {
        Gate::forUser($actor)->authorize('update', $task);

        return DB::transaction(function () use ($actor, $task, $data): Task {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($task->project_id)
                ->firstOrFail();
            $lockedTask = Task::query()
                ->lockForUpdate()
                ->whereKey($task->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('update', $lockedTask);
            $this->ensureFresh($lockedTask, $data['expected_updated_at'] ?? null);

            $before = $this->summary($lockedTask);
            $changedFields = [];

            if (array_key_exists('title', $data)) {
                $lockedTask->title = $this->requirements->requiredText(
                    $data['title'],
                    'title',
                    160,
                );
                $changedFields[] = 'title';
            }

            if (array_key_exists('description', $data)) {
                $lockedTask->description = $this->requirements->nullableText(
                    $data['description'],
                    'description',
                    5000,
                );
                $changedFields[] = 'description';
            }

            if (array_key_exists('priority', $data)) {
                $lockedTask->priority = $this->requirements->priority($data['priority']);
                $changedFields[] = 'priority';
            }

            if ($this->requirements->hasDueAt($data)) {
                $lockedTask->due_at = $this->requirements->dueAt(
                    $this->requirements->dueAtInput($data),
                    $lockedProject,
                );
                $changedFields[] = 'due_at';
            }

            if ($lockedTask->isDirty()) {
                $lockedTask->save();
            }

            $changedFields = array_values(array_unique($changedFields));

            if ($changedFields !== []) {
                $this->audit->record(
                    operation: 'task.updated',
                    auditable: $lockedTask,
                    actor: $actor,
                    institution: Institution::query()->findOrFail($lockedProject->institution_id),
                    before: [...$before, 'fields' => $changedFields],
                    after: [...$this->summary($lockedTask), 'fields' => $changedFields],
                );
            }

            return $lockedTask->refresh()->load(['project', 'createdBy', 'assignments.assignee']);
        }, attempts: 3);
    }

    private function ensureFresh(Task $task, mixed $expectedUpdatedAt): void
    {
        if ($expectedUpdatedAt === null || $expectedUpdatedAt === '') {
            return;
        }

        try {
            $expected = Carbon::parse((string) $expectedUpdatedAt);
        } catch (Throwable) {
            throw ValidationException::withMessages([
                'expected_updated_at' => 'Versi task tidak valid.',
            ]);
        }

        if ($task->updated_at->equalTo($expected)) {
            return;
        }

        throw new ConflictHttpException(
            'Task ini sudah berubah di sesi lain. Muat data terbaru sebelum menyimpan kembali.',
        );
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
