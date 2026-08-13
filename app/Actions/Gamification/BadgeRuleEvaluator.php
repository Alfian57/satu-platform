<?php

declare(strict_types=1);

namespace App\Actions\Gamification;

use App\Enums\BadgeRuleType;
use App\Models\BadgeRuleVersion;
use InvalidArgumentException;

final class BadgeRuleEvaluator
{
    public function passes(BadgeRuleVersion $rule, int $verifiedContributionCount): bool
    {
        if ($verifiedContributionCount < 0) {
            throw new InvalidArgumentException('Verified contribution count tidak boleh negatif.');
        }

        return match ($rule->rule_type) {
            BadgeRuleType::VerifiedContributionCount => $verifiedContributionCount >= $this->minimumCount($rule),
            BadgeRuleType::Manual => false,
        };
    }

    public function explanation(BadgeRuleVersion $rule): string
    {
        return match ($rule->rule_type) {
            BadgeRuleType::VerifiedContributionCount => sprintf(
                'Minimal %d kontribusi tervalidasi campus reviewer.',
                $this->minimumCount($rule),
            ),
            BadgeRuleType::Manual => 'Diterbitkan melalui review manual campus reviewer.',
        };
    }

    private function minimumCount(BadgeRuleVersion $rule): int
    {
        $minimum = $rule->criteria['minimum_approved_contributions'] ?? null;

        if (! is_int($minimum) || $minimum < 1) {
            throw new InvalidArgumentException('Badge rule memiliki minimum contribution yang tidak valid.');
        }

        return $minimum;
    }
}
