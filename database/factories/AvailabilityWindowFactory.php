<?php

namespace Database\Factories;

use App\Models\AvailabilityWindow;
use App\Models\StudentProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AvailabilityWindow>
 */
class AvailabilityWindowFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_profile_id' => StudentProfile::factory(),
            'day_of_week' => fake()->numberBetween(0, 6),
            'starts_at' => '09:00:00',
            'ends_at' => '17:00:00',
            'timezone' => 'Asia/Jakarta',
        ];
    }
}
