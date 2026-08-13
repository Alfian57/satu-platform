<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\LeaderboardScopeType;
use App\Models\Institution;
use App\Models\LeaderboardPreference;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaderboardPreference>
 */
class LeaderboardPreferenceFactory extends Factory
{
    protected $model = LeaderboardPreference::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory()->active(),
            'user_id' => User::factory(),
            'scope_type' => LeaderboardScopeType::Individual,
            'is_opted_in' => false,
            'version' => 1,
            'changed_at' => now(),
        ];
    }

    public function optedIn(): static
    {
        return $this->state([
            'is_opted_in' => true,
        ]);
    }
}
