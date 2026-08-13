<?php

namespace App\Enums;

enum BadgeRuleType: string
{
    case VerifiedContributionCount = 'verified_contribution_count';
    case Manual = 'manual';
}
