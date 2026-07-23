<?php

namespace Database\Factories;

use App\Enums\InstitutionDomainStatus;
use App\Models\Institution;
use App\Models\InstitutionDomain;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InstitutionDomain>
 */
class InstitutionDomainFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory(),
            'domain' => fake()->unique()->domainName(),
            'status' => InstitutionDomainStatus::Pending,
            'verified_at' => null,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InstitutionDomainStatus::Verified,
            'verified_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InstitutionDomainStatus::Rejected,
            'verified_at' => null,
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InstitutionDomainStatus::Suspended,
            'verified_at' => null,
        ]);
    }
}
