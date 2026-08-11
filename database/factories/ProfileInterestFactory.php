<?php

namespace Database\Factories;

use App\Models\ProfileInterest;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProfileInterest>
 */
class ProfileInterestFactory extends Factory
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
            'skill_taxonomy_id' => SkillTaxonomy::factory()->state([
                'category' => 'interest',
            ]),
        ];
    }
}
