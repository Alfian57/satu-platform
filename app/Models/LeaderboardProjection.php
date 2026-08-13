<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\LeaderboardScopeType;
use Database\Factories\LeaderboardProjectionFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Append-only, tenant-scoped leaderboard snapshot row.
 *
 * @property int $id
 * @property int $leaderboard_period_id
 * @property int $institution_id
 * @property LeaderboardScopeType $scope_type
 * @property int|null $scope_id
 * @property string|null $scope_key
 * @property string|null $scope_label
 * @property int|null $rank
 * @property int|null $shared_rank_group
 * @property string $score
 * @property int $verified_xp_total
 * @property int $active_member_denominator
 * @property int $cohort_size
 * @property bool $suppressed
 * @property string|null $suppression_reason
 * @property string $snapshot_digest
 * @property string $snapshot_key
 * @property Carbon $computed_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['*'])]
class LeaderboardProjection extends Model implements InstitutionOwned
{
    /** @use HasFactory<LeaderboardProjectionFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<LeaderboardPeriod, $this>
     */
    public function period(): BelongsTo
    {
        return $this->belongsTo(LeaderboardPeriod::class, 'leaderboard_period_id');
    }

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    public function isStale(?Carbon $at = null): bool
    {
        if ($this->relationLoaded('period')) {
            return $this->period->isStale($at);
        }

        $threshold = (int) config('gamification.leaderboard_stale_hours', 24);

        return $this->computed_at->lt(($at ?? now())->subHours($threshold));
    }

    /**
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function forPeriod(Builder $query, LeaderboardPeriod|int $period): void
    {
        $query->where(
            'leaderboard_period_id',
            $period instanceof LeaderboardPeriod ? $period->getKey() : $period,
        );
    }

    /**
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Leaderboard projections are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Leaderboard projections are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'leaderboard_period_id' => 'integer',
            'institution_id' => 'integer',
            'scope_type' => LeaderboardScopeType::class,
            'scope_id' => 'integer',
            'rank' => 'integer',
            'shared_rank_group' => 'integer',
            'score' => 'decimal:4',
            'verified_xp_total' => 'integer',
            'active_member_denominator' => 'integer',
            'cohort_size' => 'integer',
            'suppressed' => 'boolean',
            'computed_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
