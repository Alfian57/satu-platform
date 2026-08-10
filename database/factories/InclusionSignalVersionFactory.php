<?php

namespace Database\Factories;

use App\Models\InclusionSignalVersion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InclusionSignalVersion>
 */
class InclusionSignalVersionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'version' => 'v'.$this->faker->unique()->numberBetween(1, 1000),
            'metrics' => [
                'low_collaboration_threshold' => 1,
            ],
            'rules' => [
                'min_collaboration_events' => 5,
            ],
            'governance_status' => 'draft',
            'author_id' => null,
            'notes' => $this->faker->sentence(),
        ];
    }
}
