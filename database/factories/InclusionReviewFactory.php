<?php

namespace Database\Factories;

use App\Models\InclusionReview;
use App\Models\InclusionSignal;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InclusionReview>
 */
class InclusionReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'inclusion_signal_id' => InclusionSignal::factory(),
            'reviewer_id' => User::factory(),
            'human_conclusion' => 'Valid',
            'support_action' => 'Counseling Recommended',
            'reason' => 'Reviewed and found need for additional follow-up.',
        ];
    }
}
