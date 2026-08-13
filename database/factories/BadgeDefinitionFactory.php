<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\BadgeCategory;
use App\Models\BadgeDefinition;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<BadgeDefinition> */
class BadgeDefinitionFactory extends Factory
{
    protected $model = BadgeDefinition::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $key = fake()->unique()->slug(2);

        return [
            'key' => $key,
            'category' => BadgeCategory::Contribution,
            'level' => 1,
            'public_name' => Str::headline($key),
            'public_description' => 'Kontribusi terverifikasi yang memenuhi kriteria badge.',
        ];
    }

    public function category(BadgeCategory $category): static
    {
        return $this->state(['category' => $category]);
    }
}
