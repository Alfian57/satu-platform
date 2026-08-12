<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ContributionEvidence;
use App\Models\ContributionVersion;
use App\Models\User;

final class ContributionEvidencePolicy
{
    public function viewAny(User $user, ContributionVersion $contributionVersion): bool
    {
        return $user->can('view', $contributionVersion->contribution);
    }

    public function view(User $user, ContributionEvidence $contributionEvidence): bool
    {
        return $contributionEvidence->exists
            && $user->can('view', $contributionEvidence->contributionVersion->contribution);
    }

    public function create(User $user, ContributionVersion $contributionVersion): bool
    {
        return $user->can('update', $contributionVersion->contribution);
    }

    public function update(User $user, ContributionEvidence $contributionEvidence): bool
    {
        return false;
    }

    public function delete(User $user, ContributionEvidence $contributionEvidence): bool
    {
        return false;
    }

    public function restore(User $user, ContributionEvidence $contributionEvidence): bool
    {
        return false;
    }

    public function forceDelete(User $user, ContributionEvidence $contributionEvidence): bool
    {
        return false;
    }
}
