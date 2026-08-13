<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Stable after-commit boundary for future approved contribution consumers.
 */
final class ContributionApproved implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public readonly int $contributionId,
        public readonly int $contributionVersionId,
        public readonly int $reviewId,
        public readonly int $reviewerId,
        public readonly int $institutionId,
        public readonly string $policyVersion,
    ) {}
}
