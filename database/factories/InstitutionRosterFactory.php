<?php

namespace Database\Factories;

use App\Enums\InstitutionRosterStatus;
use App\Models\Institution;
use App\Models\InstitutionRoster;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InstitutionRoster>
 */
class InstitutionRosterFactory extends Factory
{
    protected $model = InstitutionRoster::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory(),
            'semester' => '2025/2026 Genap',
            'source_filename' => 'roster.csv',
            'checksum' => fake()->sha256(),
            'total_rows' => 0,
            'valid_rows' => 0,
            'error_rows' => 0,
            'status' => InstitutionRosterStatus::Active,
            'activated_at' => now(),
            'superseded_at' => null,
        ];
    }
}
