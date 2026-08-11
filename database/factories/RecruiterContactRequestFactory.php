<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ContactRequestStatus;
use App\Models\RecruiterContactRequest;
use App\Models\RecruiterOrganization;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<RecruiterContactRequest>
 */
class RecruiterContactRequestFactory extends Factory
{
    protected $model = RecruiterContactRequest::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'recruiter_organization_id' => RecruiterOrganization::factory(),
            'recruiter_user_id' => User::factory(),
            'talent_candidate_projection_id' => TalentCandidateProjection::factory(),
            'candidate_user_id' => User::factory(),
            'purpose' => 'Recruitment exploration for software development role.',
            'message' => 'We would love to discuss potential project opportunities.',
            'status' => ContactRequestStatus::Pending,
            'expires_at' => Carbon::now()->addDays(7),
        ];
    }
}
