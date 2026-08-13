<?php

namespace App\Enums;

enum ContributionReviewDecision: string
{
    case Approved = 'approved';
    case Revision = 'revision';
    case Rejected = 'rejected';

    public function contributionStatus(): ContributionStatus
    {
        return match ($this) {
            self::Approved => ContributionStatus::Approved,
            self::Revision => ContributionStatus::Revision,
            self::Rejected => ContributionStatus::Rejected,
        };
    }

    public function requiresReason(): bool
    {
        return $this !== self::Approved;
    }
}
