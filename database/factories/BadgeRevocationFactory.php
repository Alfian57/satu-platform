<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\BadgeAward;
use App\Models\BadgeRevocation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<BadgeRevocation> */
class BadgeRevocationFactory extends Factory
{
    protected $model = BadgeRevocation::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'badge_award_id' => BadgeAward::factory()->revoked(),
            'actor_id' => User::factory(),
            'reason' => 'Badge dicabut setelah review anti-abuse.',
            'revoked_at' => now(),
        ];
    }
}
