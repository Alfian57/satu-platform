<?php

namespace Database\Factories;

use App\Enums\InvitationStatus;
use App\Models\Institution;
use App\Models\PrivilegedInvitation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<PrivilegedInvitation>
 */
class PrivilegedInvitationFactory extends Factory
{
    protected $model = PrivilegedInvitation::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory(),
            'intended_role' => 'campus_admin',
            'phone' => '+628'.fake()->numerify('##########'),
            'token_hash' => Hash::make('test-token'),
            'status' => InvitationStatus::Issued,
            'expires_at' => Carbon::now()->addDays(7),
            'issued_by' => User::factory(),
            'audit_reference' => 'invitation_'.fake()->uuid(),
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => Carbon::now()->subDay(),
        ]);
    }

    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InvitationStatus::Accepted,
            'accepted_at' => Carbon::now(),
            'accepted_by' => User::factory(),
        ]);
    }

    public function revoked(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InvitationStatus::Revoked,
            'revoked_at' => Carbon::now(),
            'revoke_reason' => 'No longer needed',
        ]);
    }
}
