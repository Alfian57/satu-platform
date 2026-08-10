<?php

namespace Database\Factories;

use App\Enums\OtpChallengeStatus;
use App\Enums\OtpPurpose;
use App\Models\OtpChallenge;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<OtpChallenge>
 */
class OtpChallengeFactory extends Factory
{
    protected $model = OtpChallenge::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'purpose' => OtpPurpose::Registration,
            'target' => '+628'.fake()->numerify('##########'),
            'token' => Hash::make('123456'),
            'status' => OtpChallengeStatus::Pending,
            'expires_at' => Carbon::now()->addMinutes(5),
            'attempts' => 0,
            'max_attempts' => 3,
            'resend_count' => 0,
            'max_resends' => 2,
            'request_context' => [
                'ip_address' => fake()->ipv4(),
                'user_agent' => fake()->userAgent(),
            ],
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => Carbon::now()->subMinute(),
        ]);
    }

    public function consumed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OtpChallengeStatus::Consumed,
            'consumed_at' => Carbon::now(),
        ]);
    }

    public function invalidated(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OtpChallengeStatus::Invalidated,
            'invalidated_at' => Carbon::now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OtpChallengeStatus::Failed,
            'attempts' => 3,
        ]);
    }

    public function maxAttempts(): static
    {
        return $this->state(fn (array $attributes) => [
            'attempts' => $attributes['max_attempts'] ?? 3,
        ]);
    }
}
