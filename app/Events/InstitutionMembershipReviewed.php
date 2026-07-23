<?php

namespace App\Events;

use App\Enums\InstitutionMembershipReviewOutcome;
use App\Enums\InstitutionMembershipStatus;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

final class InstitutionMembershipReviewed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public readonly int $membershipId,
        public readonly int $institutionId,
        public readonly InstitutionMembershipReviewOutcome $outcome,
        public readonly InstitutionMembershipStatus $status,
    ) {}
}
