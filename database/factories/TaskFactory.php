<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory()->open(),
            'created_by_id' => User::factory(),
            'title' => fake()->sentence(5),
            'description' => fake()->optional()->paragraph(),
            'status' => TaskStatus::Todo,
            'priority' => TaskPriority::Medium,
            'due_at' => now()->addDays(7),
        ];
    }

    public function todo(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => TaskStatus::Todo,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => TaskStatus::InProgress,
        ]);
    }

    public function blocked(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => TaskStatus::Blocked,
        ]);
    }

    public function done(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => TaskStatus::Done,
        ]);
    }

    public function lowPriority(): static
    {
        return $this->state(fn (array $attributes): array => [
            'priority' => TaskPriority::Low,
        ]);
    }

    public function highPriority(): static
    {
        return $this->state(fn (array $attributes): array => [
            'priority' => TaskPriority::High,
        ]);
    }

    public function urgent(): static
    {
        return $this->state(fn (array $attributes): array => [
            'priority' => TaskPriority::Urgent,
        ]);
    }

    public function withoutDueAt(): static
    {
        return $this->state(fn (array $attributes): array => [
            'due_at' => null,
        ]);
    }
}
