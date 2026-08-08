<?php

namespace App\Policies;

use App\Models\RecruiterVerificationReview;
use App\Models\User;

final class RecruiterVerificationReviewPolicy
{
    /**
     * Determine whether the user can view the review.
     */
    public function view(User $user, RecruiterVerificationReview $review): bool
    {
        // Platform Admins can view all reviews.
        if ($user->getAttribute('is_platform_admin') === true) {
            return true;
        }

        // Organization members can view their own organization's reviews.
        return $review->organization->memberships()
            ->where('user_id', $user->getKey())
            ->exists();
    }
}
