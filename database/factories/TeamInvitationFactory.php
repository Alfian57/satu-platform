<?php

namespace Database\Factories;

use App\Enums\TeamInvitationStatus;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeamInvitation>
 */
class TeamInvitationFactory extends Factory
{
    protected $model = TeamInvitation::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'project_role_id' => null,
            'inviter_id' => User::factory(),
            'invitee_id' => User::factory(),
            'status' => TeamInvitationStatus::Pending,
            'pending_key' => 'pending',
            'expires_at' => now()->addDays(7),
            'responded_at' => null,
            'response_reason' => null,
        ];
    }

    public function forRole(ProjectRole $role): static
    {
        return $this->state([
            'project_id' => $role->project_id,
            'project_role_id' => $role->getKey(),
        ]);
    }

    public function accepted(): static
    {
        return $this->state([
            'status' => TeamInvitationStatus::Accepted,
            'pending_key' => null,
            'expires_at' => now()->addDay(),
            'responded_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state([
            'status' => TeamInvitationStatus::Rejected,
            'pending_key' => null,
            'expires_at' => now()->addDay(),
            'responded_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state([
            'status' => TeamInvitationStatus::Pending,
            'pending_key' => 'pending',
            'expires_at' => now()->subMinute(),
        ]);
    }
}
