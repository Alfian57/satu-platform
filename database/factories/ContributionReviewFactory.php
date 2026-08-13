<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ContributionReviewDecision;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ContributionReview> */
class ContributionReviewFactory extends Factory
{
    protected $model = ContributionReview::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'contribution_version_id' => ContributionVersion::factory(),
            'reviewer_id' => User::factory(),
            'decision' => ContributionReviewDecision::Approved,
            'policy_version' => 'contribution-review-v1',
            'reason' => null,
            'note' => fake()->optional()->sentence(),
            'reviewed_at' => now(),
        ];
    }

    public function approved(): static
    {
        return $this->state([
            'decision' => ContributionReviewDecision::Approved,
            'reason' => null,
        ]);
    }

    public function revisionRequested(string $reason = 'Evidence perlu dilengkapi.'): static
    {
        return $this->state([
            'decision' => ContributionReviewDecision::Revision,
            'reason' => $reason,
        ]);
    }

    public function rejected(string $reason = 'Klaim belum dapat diverifikasi.'): static
    {
        return $this->state([
            'decision' => ContributionReviewDecision::Rejected,
            'reason' => $reason,
        ]);
    }
}
