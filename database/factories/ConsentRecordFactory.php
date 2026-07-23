<?php

namespace Database\Factories;

use App\Models\ConsentRecord;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ConsentRecord>
 */
class ConsentRecordFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $occurredAt = now();

        return [
            'user_id' => User::factory(),
            'purpose' => 'factory.testing',
            'policy_version' => 'v1',
            'source' => 'factory',
            'granted_at' => $occurredAt,
            'withdrawn_at' => null,
            'occurred_at' => $occurredAt,
        ];
    }

    public function granted(): static
    {
        return $this->state(function (array $attributes): array {
            $occurredAt = now();

            return [
                'granted_at' => $occurredAt,
                'withdrawn_at' => null,
                'occurred_at' => $occurredAt,
            ];
        });
    }

    public function withdrawn(): static
    {
        return $this->state(function (array $attributes): array {
            $occurredAt = now();

            return [
                'granted_at' => null,
                'withdrawn_at' => $occurredAt,
                'occurred_at' => $occurredAt,
            ];
        });
    }
}
