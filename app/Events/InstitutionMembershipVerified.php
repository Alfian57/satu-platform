<?php

namespace App\Events;

use App\Enums\InstitutionMembershipStatus;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

final class InstitutionMembershipVerified implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public readonly int $membershipId,
        public readonly int $userId,
        public readonly int $institutionId,
        public readonly InstitutionMembershipStatus $status,
    ) {}
}
