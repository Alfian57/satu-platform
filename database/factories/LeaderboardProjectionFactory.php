<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\LeaderboardScopeType;
use App\Models\Institution;
use App\Models\LeaderboardPeriod;
use App\Models\LeaderboardProjection;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<LeaderboardProjection>
 */
class LeaderboardProjectionFactory extends Factory
{
    protected $model = LeaderboardProjection::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $snapshotDigest = hash('sha256', Str::uuid()->toString());

        return [
            'leaderboard_period_id' => LeaderboardPeriod::factory(),
            'institution_id' => Institution::factory()->active(),
            'scope_type' => LeaderboardScopeType::Program,
            'scope_id' => null,
            'scope_key' => 'program:Informatika',
            'scope_label' => 'Informatika',
            'rank' => 1,
            'shared_rank_group' => null,
            'score' => '1.0000',
            'verified_xp_total' => 5,
            'active_member_denominator' => 5,
            'cohort_size' => 5,
            'suppressed' => false,
            'suppression_reason' => null,
            'snapshot_digest' => $snapshotDigest,
            'snapshot_key' => hash('sha256', $snapshotDigest.'|program:Informatika'),
            'computed_at' => now(),
        ];
    }
}
