<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\RecruiterOrganization;
use App\Models\RecruiterSavedCandidate;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecruiterSavedCandidate>
 */
class RecruiterSavedCandidateFactory extends Factory
{
    protected $model = RecruiterSavedCandidate::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'recruiter_organization_id' => RecruiterOrganization::factory(),
            'user_id' => User::factory(),
            'talent_candidate_projection_id' => TalentCandidateProjection::factory(),
        ];
    }
}
