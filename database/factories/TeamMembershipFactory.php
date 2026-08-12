<?php

namespace Database\Factories;

use App\Enums\TeamMembershipStatus;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeamMembership>
 */
class TeamMembershipFactory extends Factory
{
    protected $model = TeamMembership::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'user_id' => User::factory(),
            'project_role_id' => null,
            'status' => TeamMembershipStatus::Active,
            'joined_at' => now(),
            'left_at' => null,
            'removed_at' => null,
            'removed_by_id' => null,
            'removal_reason' => null,
        ];
    }

    public function forRole(?ProjectRole $role = null): static
    {
        if ($role === null) {
            return $this;
        }

        return $this->state([
            'project_id' => $role->project_id,
            'project_role_id' => $role->getKey(),
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => TeamMembershipStatus::Active,
            'joined_at' => now(),
            'left_at' => null,
            'removed_at' => null,
            'removed_by_id' => null,
            'removal_reason' => null,
        ]);
    }

    public function left(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => TeamMembershipStatus::Left,
            'joined_at' => now()->subDay(),
            'left_at' => now(),
            'removed_at' => null,
            'removed_by_id' => null,
            'removal_reason' => null,
        ]);
    }

    public function removed(?User $remover = null, string $reason = 'Membership removed by the project owner.'): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => TeamMembershipStatus::Removed,
            'joined_at' => now()->subDays(2),
            'left_at' => null,
            'removed_at' => now(),
            'removed_by_id' => $remover?->getKey() ?? User::factory(),
            'removal_reason' => $reason,
        ]);
    }
}
