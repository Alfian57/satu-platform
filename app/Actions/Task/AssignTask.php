<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Actions\Audit\AuditRecorder;
use App\Enums\InstitutionMembershipRole;
use App\Enums\TeamMembershipStatus;
use App\Events\WorkspaceTaskChanged;
use App\Models\Institution;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TeamMembership;
use App\Models\User;
use App\Policies\InstitutionContextResolver;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class AssignTask
{
    public function __construct(
        private readonly AuditRecorder $audit,
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function handle(User $actor, Task $task, User $assignee): TaskAssignment
    {
        Gate::forUser($actor)->authorize('assign', $task);

        return DB::transaction(function () use ($actor, $task, $assignee): TaskAssignment {
            $lockedProject = Project::query()
                ->lockForUpdate()
                ->whereKey($task->project_id)
                ->firstOrFail();
            $lockedTask = Task::query()
                ->lockForUpdate()
                ->whereKey($task->getKey())
                ->firstOrFail();

            Gate::forUser($actor)->authorize('assign', $lockedTask);
            $this->ensureAssignee($assignee, $lockedProject);

            $assignment = TaskAssignment::query()
                ->lockForUpdate()
                ->where('task_id', $lockedTask->getKey())
                ->where('user_id', $assignee->getKey())
                ->first();

            if ($assignment !== null) {
                return $assignment->load('assignee');
            }

            $assignment = TaskAssignment::query()->forceCreate([
                'task_id' => $lockedTask->getKey(),
                'user_id' => $assignee->getKey(),
                'assigned_by_id' => $actor->getKey(),
            ]);

            $this->audit->record(
                operation: 'task.assigned',
                auditable: $assignment,
                actor: $actor,
                institution: Institution::query()->findOrFail($lockedProject->institution_id),
                after: [
                    'assignment_id' => $assignment->getKey(),
                    'task_id' => $lockedTask->getKey(),
                    'user_id' => $assignee->getKey(),
                ],
            );

            WorkspaceTaskChanged::dispatch(
                institutionId: (int) $lockedProject->institution_id,
                projectId: (int) $lockedProject->getKey(),
                resourceId: (int) $lockedTask->getKey(),
                operation: 'task.assigned',
                version: $lockedTask->updated_at->toIso8601String(),
                occurredAt: now()->toIso8601String(),
            );

            return $assignment->load('assignee');
        }, attempts: 3);
    }

    private function ensureAssignee(User $assignee, Project $project): void
    {
        if (
            ! $assignee->exists
            || $assignee->isDirty($assignee->getKeyName())
            || $this->institutionContextResolver->resolve(
                $assignee,
                $project,
                [InstitutionMembershipRole::Student],
            ) === null
        ) {
            throw new AuthorizationException(
                'Assignee harus merupakan student terverifikasi pada institution project.',
            );
        }

        if (
            $project->owner_id !== $assignee->getKey()
            && ! TeamMembership::query()
                ->where('project_id', $project->getKey())
                ->where('user_id', $assignee->getKey())
                ->where('status', TeamMembershipStatus::Active)
                ->exists()
        ) {
            throw new AuthorizationException(
                'Assignee harus merupakan anggota aktif pada team project.',
            );
        }
    }
}
