<?php

namespace Database\Factories;

use App\Models\InclusionSignal;
use App\Models\InclusionSignalVersion;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InclusionSignal>
 */
class InclusionSignalFactory extends Factory
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
            'subject_id' => User::factory(),
            'version_id' => InclusionSignalVersion::factory(),
            'period' => '2026-S1',
            'restricted_feature_state' => false,
            'data_sufficiency_met' => true,
            'evidence_summary' => [
                'factor' => 'User has sufficient collaboration events.',
            ],
        ];
    }
}
