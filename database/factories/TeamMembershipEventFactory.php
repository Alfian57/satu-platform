<?php

namespace Database\Factories;

use App\Enums\TeamMembershipEventType;
use App\Models\TeamMembership;
use App\Models\TeamMembershipEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeamMembershipEvent>
 */
class TeamMembershipEventFactory extends Factory
{
    protected $model = TeamMembershipEvent::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_membership_id' => TeamMembership::factory(),
            'actor_id' => User::factory(),
            'event' => TeamMembershipEventType::Joined,
            'reason' => null,
            'metadata' => null,
            'created_at' => now(),
        ];
    }
}
