<?php

namespace Database\Factories;

use App\Enums\PortfolioVisibility;
use App\Models\Institution;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentProfile>
 */
class StudentProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'institution_id' => Institution::factory()->active(),
            'bio' => fake()->optional()->paragraph(),
            'study_program' => fake()->optional()->randomElement([
                'Informatika',
                'Sistem Informasi',
                'Manajemen',
            ]),
            'study_year' => fake()->optional()->numberBetween(1, 8),
            'portfolio_visibility' => PortfolioVisibility::Private,
            'recruiter_discoverable' => false,
        ];
    }
}
