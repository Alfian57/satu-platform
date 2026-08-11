<?php

namespace Database\Factories;

use App\Enums\SkillProficiency;
use App\Models\ProfileSkill;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProfileSkill>
 */
class ProfileSkillFactory extends Factory
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
            'skill_taxonomy_id' => SkillTaxonomy::factory(),
            'proficiency' => fake()->randomElement(SkillProficiency::cases()),
            'evidence_metadata' => null,
        ];
    }
}
