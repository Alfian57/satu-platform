<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaskAssignment>
 */
class TaskAssignmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'user_id' => User::factory(),
            'assigned_by_id' => null,
        ];
    }

    public function assignedBy(User $actor): static
    {
        return $this->state([
            'assigned_by_id' => $actor->getKey(),
        ]);
    }
}
