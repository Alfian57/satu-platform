<?php

namespace App\Policies;

use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use InvalidArgumentException;

final readonly class InstitutionContext
{
    /**
     * Create a verified institution context for an actor.
     */
    public function __construct(
        public User $actor,
        public Institution $institution,
        public InstitutionMembership $membership,
    ) {
        if (
            $institution->status !== InstitutionStatus::Active
            || $membership->status !== InstitutionMembershipStatus::Verified
            || $membership->user_id !== $actor->getKey()
            || $membership->institution_id !== $institution->getKey()
        ) {
            throw new InvalidArgumentException('Institution context requires a verified membership in an active institution.');
        }
    }
}
