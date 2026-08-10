<?php

namespace Database\Factories;

use App\Enums\MessagePurpose;
use App\Enums\MessageStatus;
use App\Models\MessageOutbox;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MessageOutbox>
 */
class MessageOutboxFactory extends Factory
{
    protected $model = MessageOutbox::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'purpose' => MessagePurpose::Otp,
            'recipient' => '+628'.fake()->numerify('##########'),
            'template_name' => 'otp_verification',
            'template_version' => '1.0.0',
            'payload' => json_encode([
                'message' => fake()->sentence(),
                'code' => '123456',
            ]),
            'status' => MessageStatus::Pending,
            'attempts' => 0,
            'max_attempts' => 3,
        ];
    }

    public function otp(): static
    {
        return $this->state(fn (array $attributes) => [
            'purpose' => MessagePurpose::Otp,
            'template_name' => 'otp_verification',
            'payload' => json_encode([
                'message' => 'Kode OTP Anda: 123456. Jangan berikan ke siapa pun.',
                'code' => '123456',
            ]),
        ]);
    }

    public function withAttempts(int $count): static
    {
        return $this->state(fn (array $attributes) => [
            'attempts' => $count,
        ]);
    }
}
