<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\User;

final class ContributionReviewPolicy
{
    public function viewAny(User $user, ContributionVersion $contributionVersion): bool
    {
        return $user->can('view', $contributionVersion->contribution);
    }

    public function view(User $user, ContributionReview $contributionReview): bool
    {
        return $contributionReview->exists
            && $user->can('view', $contributionReview->contributionVersion->contribution);
    }

    public function create(User $user, ContributionVersion $contributionVersion): bool
    {
        return $user->can('review', $contributionVersion->contribution);
    }

    public function update(User $user, ContributionReview $contributionReview): bool
    {
        return false;
    }

    public function delete(User $user, ContributionReview $contributionReview): bool
    {
        return false;
    }

    public function restore(User $user, ContributionReview $contributionReview): bool
    {
        return false;
    }

    public function forceDelete(User $user, ContributionReview $contributionReview): bool
    {
        return false;
    }
}
