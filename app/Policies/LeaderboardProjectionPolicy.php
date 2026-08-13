<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\Institution;
use App\Models\LeaderboardProjection;
use App\Models\User;

final class LeaderboardProjectionPolicy
{
    public function viewAny(User $user, Institution $institution): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $institution,
            [InstitutionMembershipRole::Student, InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }

    public function view(User $user, LeaderboardProjection $projection): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $projection,
            [InstitutionMembershipRole::Student, InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, LeaderboardProjection $projection): bool
    {
        return false;
    }

    public function delete(User $user, LeaderboardProjection $projection): bool
    {
        return false;
    }

    public function restore(User $user, LeaderboardProjection $projection): bool
    {
        return false;
    }

    public function forceDelete(User $user, LeaderboardProjection $projection): bool
    {
        return false;
    }

    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}
}
