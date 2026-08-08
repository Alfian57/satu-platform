<?php

namespace Database\Factories;

use App\Enums\InclusionSignalStatus;
use App\Models\InclusionSignal;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InclusionSignal>
 */
class InclusionSignalFactory extends Factory
{
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory(),
            'subject_id' => User::factory(),
            'version' => '1.0.0',
            'period_start' => fake()->dateTimeBetween('-90 days', '-30 days'),
            'period_end' => fake()->dateTimeBetween('-30 days', 'now'),
            'status' => InclusionSignalStatus::New,
            'evidence_summary' => ['degree' => 0, 'event_count' => 5],
            'is_synthetic' => false,
        ];
    }

    public function synthetic(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_synthetic' => true,
        ]);
    }
}
