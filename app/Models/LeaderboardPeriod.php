<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Database\Factories\LeaderboardPeriodFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Immutable institution-scoped leaderboard semester and rule snapshot.
 *
 * @property int $id
 * @property int $institution_id
 * @property string $semester
 * @property string $rule_version
 * @property string|null $latest_snapshot_digest
 * @property Carbon|null $computed_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['*'])]
class LeaderboardPeriod extends Model implements InstitutionOwned
{
    /** @use HasFactory<LeaderboardPeriodFactory> */
    use HasFactory;

    public const RULE_VERSION = '1.0.0';

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * @return HasMany<LeaderboardProjection, $this>
     */
    public function projections(): HasMany
    {
        return $this->hasMany(LeaderboardProjection::class);
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    public function isStale(?Carbon $at = null): bool
    {
        if ($this->computed_at === null) {
            return true;
        }

        $threshold = (int) config('gamification.leaderboard_stale_hours', 24);

        return $this->computed_at->lt(($at ?? now())->subHours($threshold));
    }

    /**
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists && $this->isDirty(['institution_id', 'semester', 'rule_version'])) {
            throw new LogicException('Leaderboard periods are immutable.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Leaderboard periods are immutable.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'institution_id' => 'integer',
            'computed_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
