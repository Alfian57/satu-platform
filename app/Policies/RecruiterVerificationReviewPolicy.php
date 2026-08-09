<?php

namespace App\Policies;

use App\Models\RecruiterVerificationReview;
use App\Models\User;

final class RecruiterVerificationReviewPolicy
{
    /**
     * Determine whether the user can view the review.
     *
     * Organisasi anggota dapat melihat review milik organisasinya sendiri.
     * Review lintas organisasi dan jalur platform-admin dibatasi sampai
     * mekanisme platform-admin nyata terpenuhi (gate:conditional).
     */
    public function view(User $user, RecruiterVerificationReview $review): bool
    {
        return $review->organization->memberships()
            ->where('user_id', $user->getKey())
            ->exists();
    }
}
