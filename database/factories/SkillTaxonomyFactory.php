<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SkillTaxonomy;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SkillTaxonomy>
 */
class SkillTaxonomyFactory extends Factory
{
    protected $model = SkillTaxonomy::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->word().' Skill',
            'category' => $this->faker->randomElement(['software', 'design', 'data', 'management']),
            'description' => 'Canonical skill taxonomy definition.',
            'is_verified' => true,
        ];
    }
}
