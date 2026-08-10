<?php

namespace Database\Factories;

use App\Enums\MessageStatus;
use App\Models\MessageDelivery;
use App\Models\MessageOutbox;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MessageDelivery>
 */
class MessageDeliveryFactory extends Factory
{
    protected $model = MessageDelivery::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'message_outbox_id' => MessageOutbox::factory(),
            'provider' => 'fonnte',
            'external_id' => 'ext_'.fake()->numerify('##########'),
            'status' => MessageStatus::Sent,
            'status_history' => [[
                'status' => 'sent',
                'timestamp' => now()->toIso8601String(),
            ]],
        ];
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => MessageStatus::Failed,
            'error_message' => 'Provider returned status 500',
            'status_history' => [[
                'status' => 'failed',
                'timestamp' => now()->toIso8601String(),
                'error' => 'Provider returned status 500',
            ]],
        ]);
    }
}
