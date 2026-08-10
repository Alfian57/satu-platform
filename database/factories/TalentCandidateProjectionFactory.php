<?php

namespace Database\Factories;

use App\Models\Institution;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TalentCandidateProjection>
 */
class TalentCandidateProjectionFactory extends Factory
{
    protected $model = TalentCandidateProjection::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'institution_id' => Institution::factory(),
            'headline' => fake()->jobTitle(),
            'bio' => fake()->paragraph(),
            'skills' => ['PHP', 'Laravel', 'TypeScript'],
            'badges' => ['Verified Student'],
            'contributions' => ['Open Source Project'],
            'is_visible' => true,
            'availability_status' => 'available',
            'verified_at' => now(),
        ];
    }
}
