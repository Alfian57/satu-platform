<?php

namespace Database\Factories;

use App\Enums\TeamJoinRequestStatus;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\TeamJoinRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeamJoinRequest>
 */
class TeamJoinRequestFactory extends Factory
{
    protected $model = TeamJoinRequest::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'project_role_id' => null,
            'requester_id' => User::factory(),
            'status' => TeamJoinRequestStatus::Pending,
            'pending_key' => 'pending',
            'message' => fake()->sentence(),
            'requested_at' => now(),
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

    public function rejected(): static
    {
        return $this->state([
            'status' => TeamJoinRequestStatus::Rejected,
            'pending_key' => null,
            'responded_at' => now(),
        ]);
    }

    public function accepted(): static
    {
        return $this->state([
            'status' => TeamJoinRequestStatus::Accepted,
            'pending_key' => null,
            'responded_at' => now(),
        ]);
    }
}
