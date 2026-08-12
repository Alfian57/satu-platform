<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Contribution;
use App\Models\ContributionVersion;
use App\Models\User;

final class ContributionVersionPolicy
{
    public function viewAny(User $user, Contribution $contribution): bool
    {
        return $user->can('view', $contribution);
    }

    public function view(User $user, ContributionVersion $contributionVersion): bool
    {
        return $contributionVersion->exists
            && $user->can('view', $contributionVersion->contribution);
    }

    public function create(User $user, Contribution $contribution): bool
    {
        return $user->can('update', $contribution);
    }

    public function update(User $user, ContributionVersion $contributionVersion): bool
    {
        return false;
    }

    public function delete(User $user, ContributionVersion $contributionVersion): bool
    {
        return false;
    }

    public function restore(User $user, ContributionVersion $contributionVersion): bool
    {
        return false;
    }

    public function forceDelete(User $user, ContributionVersion $contributionVersion): bool
    {
        return false;
    }
}
