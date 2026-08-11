<?php

namespace Database\Factories;

use App\Enums\ProjectStatus;
use App\Enums\ProjectVisibility;
use App\Models\Institution;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory()->active(),
            'owner_id' => User::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => ProjectStatus::Open,
            'visibility' => ProjectVisibility::Institution,
            'capacity' => 5,
            'deadline' => now()->addWeeks(4),
        ];
    }

    public function open(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProjectStatus::Open,
        ]);
    }

    public function forming(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProjectStatus::Forming,
        ]);
    }

    public function full(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProjectStatus::Full,
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProjectStatus::Closed,
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProjectStatus::Cancelled,
        ]);
    }

    public function privateVisibility(): static
    {
        return $this->state(fn (array $attributes) => [
            'visibility' => ProjectVisibility::Private,
        ]);
    }

    public function publicVisibility(): static
    {
        return $this->state(fn (array $attributes) => [
            'visibility' => ProjectVisibility::Public,
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'deadline' => now()->subDay(),
        ]);
    }
}
