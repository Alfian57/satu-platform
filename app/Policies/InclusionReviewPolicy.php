<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipRole;
use App\Models\InclusionReview;
use App\Models\User;

final class InclusionReviewPolicy
{
    public function __construct(
        private readonly InstitutionContextResolver $institutionContextResolver,
    ) {}

    public function viewAny(User $user, InclusionReview $review): bool
    {
        if (! $user->exists || $user->isDirty($user->getKeyName())) {
            return false;
        }

        if (! $review->exists) {
            return false;
        }

        // We resolve through the signal's institution
        $signal = $review->signal;
        if (! $signal || ! $signal->exists) {
            return false;
        }

        return $this->institutionContextResolver->resolve(
            $user,
            $signal,
            [InstitutionMembershipRole::CampusAdmin],
        ) !== null;
    }

    public function view(User $user, InclusionReview $review): bool
    {
        return $this->viewAny($user, $review);
    }
}
