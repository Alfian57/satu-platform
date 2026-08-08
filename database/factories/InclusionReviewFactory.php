<?php

namespace Database\Factories;

use App\Enums\InclusionReviewConclusion;
use App\Models\InclusionReview;
use App\Models\InclusionSignal;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InclusionReview>
 */
class InclusionReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'inclusion_signal_id' => InclusionSignal::factory(),
            'reviewer_id' => User::factory(),
            'conclusion' => InclusionReviewConclusion::Acknowledged,
            'support_action' => null,
            'reason' => fake()->sentence(),
        ];
    }
}
