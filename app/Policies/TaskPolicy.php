<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Enums\ProjectStatus;
use App\Enums\TeamMembershipStatus;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMembership;
use App\Models\User;

final class TaskPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function viewAny(User $user, Project $project): bool
    {
        return $this->canAccessProject($user, $project);
    }

    public function view(User $user, Task $task): bool
    {
        $project = $this->projectFor($task);

        return $project !== null && $this->canAccessProject($user, $project);
    }

    public function create(User $user, Project $project): bool
    {
        return $this->canAccessProject($user, $project);
    }

    public function update(User $user, Task $task): bool
    {
        return $this->view($user, $task);
    }

    public function delete(User $user, Task $task): bool
    {
        return $this->view($user, $task);
    }

    public function transition(User $user, Task $task): bool
    {
        return $this->view($user, $task);
    }

    public function assign(User $user, Task $task): bool
    {
        return $this->view($user, $task);
    }

    public function unassign(User $user, Task $task): bool
    {
        return $this->assign($user, $task);
    }

    private function projectFor(Task $task): ?Project
    {
        if (
            ! $task->exists
            || $task->isDirty([$task->getKeyName(), 'project_id'])
        ) {
            return null;
        }

        return Project::query()->whereKey($task->project_id)->first();
    }

    private function canAccessProject(User $user, Project $project): bool
    {
        if (
            ! $user->exists
            || $user->isDirty($user->getKeyName())
            || ! $project->exists
            || $project->isDirty([$project->getKeyName(), 'institution_id', 'owner_id'])
            || ! in_array($project->status, [
                ProjectStatus::Open,
                ProjectStatus::Forming,
                ProjectStatus::Full,
            ], true)
            || $this->institutionContextResolver->resolve(
                $user,
                $project,
                [InstitutionMembershipRole::Student],
            ) === null
        ) {
            return false;
        }

        return $project->owner_id === $user->getKey()
            || TeamMembership::query()
                ->where('project_id', $project->getKey())
                ->where('user_id', $user->getKey())
                ->where('status', TeamMembershipStatus::Active)
                ->exists();
    }
}
