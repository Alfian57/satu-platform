<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Institution;
use App\Models\LeaderboardPeriod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaderboardPeriod>
 */
class LeaderboardPeriodFactory extends Factory
{
    protected $model = LeaderboardPeriod::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory()->active(),
            'semester' => '2025/2026 Genap',
            'rule_version' => LeaderboardPeriod::RULE_VERSION,
        ];
    }
}
