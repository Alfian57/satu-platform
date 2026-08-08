<?php

namespace Database\Factories;

use App\Enums\CollaborationEventType;
use App\Models\CollaborationEvent;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CollaborationEvent>
 */
class CollaborationEventFactory extends Factory
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
            'target_id' => User::factory(),
            'event_type' => fake()->randomElement(CollaborationEventType::cases()),
            'context_type' => null,
            'context_id' => null,
            'occurred_at' => fake()->dateTimeBetween('-90 days', 'now'),
            'metadata' => null,
            'is_synthetic' => false,
        ];
    }

    public function teamJoined(): static
    {
        return $this->state(fn (array $attributes): array => [
            'event_type' => CollaborationEventType::TeamJoined,
        ]);
    }

    public function taskCompleted(): static
    {
        return $this->state(fn (array $attributes): array => [
            'event_type' => CollaborationEventType::TaskCompleted,
        ]);
    }

    public function projectContributed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'event_type' => CollaborationEventType::ProjectContributed,
        ]);
    }

    public function peerReviewed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'event_type' => CollaborationEventType::PeerReviewed,
        ]);
    }

    public function synthetic(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_synthetic' => true,
        ]);
    }

    public function solo(): static
    {
        return $this->state(fn (array $attributes): array => [
            'target_id' => null,
        ]);
    }

    public function occurredAt(\DateTimeInterface $date): static
    {
        return $this->state(fn (array $attributes): array => [
            'occurred_at' => $date,
        ]);
    }
}
