<?php

namespace App\Policies;

use App\Models\InclusionReview;
use App\Models\User;

class InclusionReviewPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, InclusionReview $inclusionReview): bool
    {
        return $user->can('view', $inclusionReview->signal);
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, InclusionReview $inclusionReview): bool
    {
        return false;
    }

    public function delete(User $user, InclusionReview $inclusionReview): bool
    {
        return false;
    }

    public function restore(User $user, InclusionReview $inclusionReview): bool
    {
        return false;
    }

    public function forceDelete(User $user, InclusionReview $inclusionReview): bool
    {
        return false;
    }
}
