<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\Institution;
use App\Models\LeaderboardPreference;
use App\Models\User;

final class LeaderboardPreferencePolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function viewAny(User $user, Institution $institution): bool
    {
        return $this->institutionContextResolver->resolve(
            $user,
            $institution,
            [InstitutionMembershipRole::Student],
        ) !== null;
    }

    public function view(User $user, LeaderboardPreference $preference): bool
    {
        return $preference->user_id === $user->getKey()
            && $this->institutionContextResolver->resolve(
                $user,
                $preference,
                [InstitutionMembershipRole::Student],
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

    public function update(User $user, LeaderboardPreference $preference): bool
    {
        return $this->view($user, $preference);
    }

    public function delete(User $user, LeaderboardPreference $preference): bool
    {
        return false;
    }

    public function restore(User $user, LeaderboardPreference $preference): bool
    {
        return false;
    }

    public function forceDelete(User $user, LeaderboardPreference $preference): bool
    {
        return false;
    }
}
