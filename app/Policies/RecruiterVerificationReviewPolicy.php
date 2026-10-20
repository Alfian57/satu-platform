<?php

namespace App\Policies;

use App\Models\RecruiterVerificationReview;
use App\Models\User;

final class RecruiterVerificationReviewPolicy
{
    /**
     * Role perekrut dihapus. Riwayat tidak memberikan izin pembacaan baru.
     */
    public function view(User $user, RecruiterVerificationReview $review): bool
    {
        return false;
    }
}
