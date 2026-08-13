<?php

declare(strict_types=1);

namespace App\Actions\Gamification;

use App\Models\Institution;
use App\Models\LeaderboardPeriod;
use App\Models\LeaderboardProjection;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class ReadLeaderboardProjections
{
    /**
     * @return Collection<int, LeaderboardProjection>
     */
    public function handle(Institution $institution, string $semester): Collection
    {
        if (
            ! $institution->exists
            || $institution->isDirty($institution->getKeyName())
        ) {
            throw new InvalidArgumentException('Leaderboard institution harus persisted.');
        }

        $semester = (string) Str::of($semester)->squish();
        $ruleVersion = (string) config(
            'gamification.leaderboard_rule_version',
            LeaderboardPeriod::RULE_VERSION,
        );
        $period = LeaderboardPeriod::query()
            ->whereBelongsTo($institution)
            ->where('semester', $semester)
            ->where('rule_version', $ruleVersion)
            ->first();

        if ($period === null || $period->latest_snapshot_digest === null) {
            return new Collection;
        }

        $cacheKey = RebuildLeaderboardProjections::cacheKey(
            $institution->getKey(),
            $semester,
            $ruleVersion,
        );
        $periodId = $period->getKey();
        $snapshotDigest = $period->latest_snapshot_digest;

        /** @var Collection<int, LeaderboardProjection> $projections */
        $projections = Cache::remember(
            $cacheKey,
            now()->addMinutes(5),
            fn (): Collection => LeaderboardProjection::query()
                ->forPeriod($periodId)
                ->whereBelongsTo($institution)
                ->where('snapshot_digest', $snapshotDigest)
                ->with('period')
                ->orderByRaw('CASE WHEN `rank` IS NULL THEN 1 ELSE 0 END')
                ->orderBy('rank')
                ->orderBy('scope_type')
                ->orderBy('scope_key')
                ->get(),
        );

        return $projections;
    }
}
