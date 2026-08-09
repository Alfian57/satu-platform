<?php

namespace Database\Factories;

use App\Enums\RecruiterOrganizationStatus;
use App\Models\RecruiterOrganization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecruiterOrganization>
 */
class RecruiterOrganizationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'industry' => fake()->jobTitle(),
            'website' => fake()->url(),
            'evidence_metadata' => ['document_id' => fake()->uuid()],
            'status' => RecruiterOrganizationStatus::Pending,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => RecruiterOrganizationStatus::Verified,
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => RecruiterOrganizationStatus::Suspended,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => RecruiterOrganizationStatus::Rejected,
        ]);
    }
}
