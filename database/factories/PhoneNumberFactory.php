<?php

namespace Database\Factories;

use App\Enums\PhoneNumberStatus;
use App\Models\PhoneNumber;
use App\Models\User;
use App\Support\PhoneIdentity;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PhoneNumber> */
class PhoneNumberFactory extends Factory
{
    protected $model = PhoneNumber::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $number = '+62812'.fake()->unique()->numerify('########');

        return [
            'user_id' => User::factory(),
            'number' => $number,
            'number_hash' => PhoneIdentity::hash($number),
            'masked' => PhoneIdentity::mask($number),
            'status' => PhoneNumberStatus::Verified,
            'verified_at' => now(),
        ];
    }

    public function forNumber(string $number): static
    {
        return $this->state(fn (): array => [
            'number' => PhoneIdentity::normalize($number),
            'number_hash' => PhoneIdentity::hash($number),
            'masked' => PhoneIdentity::mask($number),
        ]);
    }

    public function revoked(): static
    {
        return $this->state(fn (): array => [
            'status' => PhoneNumberStatus::Revoked,
            'verified_at' => null,
        ]);
    }
}
