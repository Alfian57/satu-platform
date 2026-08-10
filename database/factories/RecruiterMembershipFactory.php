<?php

namespace Database\Factories;

use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterMembershipStatus;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecruiterMembership>
 */
class RecruiterMembershipFactory extends Factory
{
    public function definition(): array
    {
        return [
            'recruiter_organization_id' => RecruiterOrganization::factory(),
            'user_id' => User::factory(),
            'role' => RecruiterMembershipRole::Recruiter,
            'status' => RecruiterMembershipStatus::Active,
        ];
    }

    public function owner(): static
    {
        return $this->state(fn (array $attributes): array => [
            'role' => RecruiterMembershipRole::Owner,
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes): array => [
            'role' => RecruiterMembershipRole::Admin,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => RecruiterMembershipStatus::Pending,
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => RecruiterMembershipStatus::Suspended,
        ]);
    }
}
