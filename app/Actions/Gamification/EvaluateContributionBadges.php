<?php

declare(strict_types=1);

namespace App\Actions\Gamification;

use App\Enums\BadgeRuleType;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Models\BadgeAward;
use App\Models\BadgeRuleVersion;
use App\Models\Contribution;
use App\Models\User;
use Illuminate\Support\Collection;
use InvalidArgumentException;

final class EvaluateContributionBadges
{
    public function __construct(
        private readonly BadgeRuleEvaluator $evaluator,
        private readonly IssueBadge $issueBadge,
    ) {}

    /**
     * Evaluate only active automatic rules against verified contribution data.
     *
     * @return Collection<int, BadgeAward>
     */
    public function handle(Contribution $contribution, User $actor): Collection
    {
        $source = Contribution::query()
            ->whereKey($contribution->getKey())
            ->firstOrFail();
        $source->load(['currentVersion', 'project']);

        if ($source->status !== ContributionStatus::Approved || $source->currentVersion === null) {
            return collect();
        }

        $hasApprovedReview = $source->currentVersion->reviews()
            ->where('decision', ContributionReviewDecision::Approved)
            ->exists();

        if (! $hasApprovedReview) {
            return collect();
        }

        if ($source->project === null || $source->project->institution_id !== $source->institution_id) {
            throw new InvalidArgumentException('Badge source dan institution harus berada dalam tenant yang sama.');
        }

        $verifiedContributionCount = Contribution::query()
            ->where('institution_id', $source->institution_id)
            ->where('owner_id', $source->owner_id)
            ->where('status', ContributionStatus::Approved)
            ->whereHas('project', function ($query) use ($source): void {
                $query->where('institution_id', $source->institution_id);
            })
            ->whereHas('currentVersion.reviews', function ($query): void {
                $query->where('decision', ContributionReviewDecision::Approved);
            })
            ->count();

        $awards = collect();
        $rules = BadgeRuleVersion::query()
            ->with('definition')
            ->where('is_active', true)
            ->where('rule_type', BadgeRuleType::VerifiedContributionCount)
            ->get();

        foreach ($rules as $rule) {
            if (! $this->evaluator->passes($rule, $verifiedContributionCount)) {
                continue;
            }

            $awards->push($this->issueBadge->handle($rule, $source, $actor));
        }

        return $awards;
    }

    /**
     * @return Collection<int, BadgeAward>
     */
    public function execute(Contribution $contribution, User $actor): Collection
    {
        return $this->handle($contribution, $actor);
    }
}
