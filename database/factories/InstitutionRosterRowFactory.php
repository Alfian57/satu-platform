<?php

namespace Database\Factories;

use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Support\PhoneIdentity;
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
        $phone = '+62812'.fake()->numerify('########');

        return [
            'roster_id' => InstitutionRoster::factory(),
            'nim' => fake()->numerify('########'),
            'nama' => fake()->name(),
            'program_studi' => fake()->word(),
            'angkatan' => (string) fake()->year(),
            'semester' => '2025/2026 Genap',
            'phone_hash' => PhoneIdentity::hash($phone),
            'phone_encrypted' => $phone,
            'is_active' => true,
        ];
    }
}
