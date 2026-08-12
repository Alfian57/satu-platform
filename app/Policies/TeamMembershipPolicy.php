<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Enums\TeamMembershipStatus;
use App\Models\Project;
use App\Models\TeamMembership;
use App\Models\User;

final class TeamMembershipPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function view(User $user, TeamMembership $membership): bool
    {
        return $this->sameTenantStudent($user, $membership->project)
            && (
                $membership->user_id === $user->getKey()
                || $membership->project->owner_id === $user->getKey()
            );
    }

    public function leave(User $user, TeamMembership $membership): bool
    {
        return $membership->status === TeamMembershipStatus::Active
            && $membership->user_id === $user->getKey()
            && $this->sameTenantStudent($user, $membership->project);
    }

    public function remove(User $user, TeamMembership $membership): bool
    {
        return $membership->status === TeamMembershipStatus::Active
            && $membership->project->owner_id !== $membership->user_id
            && $this->isProjectOwner($user, $membership->project);
    }

    private function isProjectOwner(User $user, Project $project): bool
    {
        return $project->owner_id === $user->getKey()
            && $this->sameTenantStudent($user, $project);
    }

    private function sameTenantStudent(User $user, Project $project): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $project,
            [InstitutionMembershipRole::Student],
        ) !== null;
    }
}
