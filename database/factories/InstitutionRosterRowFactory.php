<?php

namespace Database\Factories;

use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InstitutionRosterRow>
 */
class InstitutionRosterRowFactory extends Factory
{
    protected $model = InstitutionRosterRow::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'roster_id' => InstitutionRoster::factory(),
            'nim' => fake()->numerify('########'),
            'nama' => fake()->name(),
            'program_studi' => fake()->word(),
            'angkatan' => (string) fake()->year(),
            'semester' => '2025/2026 Genap',
            'phone' => '+628'.fake()->numerify('##########'),
            'is_active' => true,
        ];
    }
}
