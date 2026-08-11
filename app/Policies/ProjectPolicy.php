<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Enums\ProjectVisibility;
use App\Models\Institution;
use App\Models\Project;
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
        ) {
            return false;
        }

        return $this->hasActiveProjectContext($user, $project, [
            InstitutionMembershipRole::Student,
            InstitutionMembershipRole::CampusAdmin,
        ]);
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
