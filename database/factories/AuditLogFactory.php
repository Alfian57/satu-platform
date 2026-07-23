<?php

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuditLog>
 */
class AuditLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory(),
            'actor_id' => User::factory(),
            'operation' => 'factory.audit_recorded',
            'auditable_type' => null,
            'auditable_id' => null,
            'before_summary' => null,
            'after_summary' => ['status' => 'recorded'],
            'reason' => null,
            'request_context' => null,
        ];
    }

    public function platform(): static
    {
        return $this->state(fn (array $attributes) => [
            'institution_id' => null,
        ]);
    }

    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'actor_id' => null,
        ]);
    }
}
