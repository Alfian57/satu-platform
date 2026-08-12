<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Enums\TeamJoinRequestStatus;
use App\Models\Project;
use App\Models\TeamJoinRequest;
use App\Models\User;

final class TeamJoinRequestPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function view(User $user, TeamJoinRequest $request): bool
    {
        return $this->sameTenantStudent($user, $request->project)
            && (
                $request->requester_id === $user->getKey()
                || $request->project->owner_id === $user->getKey()
            );
    }

    public function accept(User $user, TeamJoinRequest $request): bool
    {
        return $request->status === TeamJoinRequestStatus::Pending
            && $this->isProjectOwner($user, $request->project);
    }

    public function reject(User $user, TeamJoinRequest $request): bool
    {
        return $this->accept($user, $request);
    }

    public function withdraw(User $user, TeamJoinRequest $request): bool
    {
        return $request->status === TeamJoinRequestStatus::Pending
            && $request->requester_id === $user->getKey()
            && $this->sameTenantStudent($user, $request->project);
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
