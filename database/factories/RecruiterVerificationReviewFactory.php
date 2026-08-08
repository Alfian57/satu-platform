<?php

namespace Database\Factories;

use App\Enums\RecruiterVerificationConclusion;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterVerificationReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecruiterVerificationReview>
 */
class RecruiterVerificationReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'recruiter_organization_id' => RecruiterOrganization::factory(),
            'reviewer_id' => User::factory(), // Platform Admin
            'conclusion' => RecruiterVerificationConclusion::Verified,
            'reason' => fake()->sentence(),
        ];
    }
}
