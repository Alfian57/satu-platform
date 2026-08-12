<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Enums\ProjectVisibility;
use App\Enums\TeamMembershipStatus;
use App\Models\Institution;
use App\Models\Project;
use App\Models\TeamMembership;
use App\Models\User;

final class ProjectPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function view(User $user, Project $project): bool
    {
        if (
            $project->visibility === ProjectVisibility::Private
            && $project->owner_id !== $user->getKey()
            && ! TeamMembership::query()
                ->where('project_id', $project->getKey())
                ->where('user_id', $user->getKey())
                ->where('status', TeamMembershipStatus::Active)
                ->exists()
        ) {
            return false;
        }

        return $this->hasActiveProjectContext($user, $project, [
            InstitutionMembershipRole::Student,
            InstitutionMembershipRole::CampusAdmin,
        ]);
    }

    public function viewAny(User $user, Institution $institution): bool
    {
        if (! $user->exists || ! $institution->exists) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $institution,
            [
                InstitutionMembershipRole::Student,
                InstitutionMembershipRole::CampusAdmin,
            ],
        ) !== null;
    }

    public function create(User $user, Institution $institution): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $institution,
            [InstitutionMembershipRole::Student],
        ) !== null;
    }

    public function update(User $user, Project $project): bool
    {
        return $this->ownsProjectInActiveInstitution($user, $project);
    }

    public function delete(User $user, Project $project): bool
    {
        return $this->ownsProjectInActiveInstitution($user, $project);
    }

    public function transition(User $user, Project $project): bool
    {
        return $this->update($user, $project);
    }

    public function open(User $user, Project $project): bool
    {
        return $this->transition($user, $project);
    }

    public function cancel(User $user, Project $project): bool
    {
        return $this->transition($user, $project);
    }

    public function archive(User $user, Project $project): bool
    {
        return $this->transition($user, $project);
    }

    public function invite(User $user, Project $project): bool
    {
        return $project->acceptsMembers() && $this->ownsProjectInActiveInstitution($user, $project);
    }

    public function requestJoin(User $user, Project $project): bool
    {
        return $project->visibility !== ProjectVisibility::Private
            && $project->acceptsMembers()
            && $this->hasActiveProjectContext($user, $project, [InstitutionMembershipRole::Student])
            && $project->owner_id !== $user->getKey();
    }

    private function ownsProjectInActiveInstitution(User $user, Project $project): bool
    {
        if (
            ! $user->exists
            || $user->isDirty($user->getKeyName())
            || ! $project->exists
            || $project->isDirty([
                $project->getKeyName(),
                'institution_id',
                'owner_id',
            ])
            || $project->owner_id !== $user->getKey()
        ) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $project,
            [InstitutionMembershipRole::Student],
        ) !== null;
    }

    /**
     * @param  list<InstitutionMembershipRole>  $allowedRoles
     */
    private function hasActiveProjectContext(
        User $user,
        Project $project,
        array $allowedRoles,
    ): bool {
        if (
            ! $user->exists
            || $user->isDirty($user->getKeyName())
            || ! $project->exists
            || $project->isDirty([$project->getKeyName(), 'institution_id'])
        ) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $project,
            $allowedRoles,
        ) !== null;
    }
}
