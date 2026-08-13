<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\LeaderboardScopeType;
use Database\Factories\LeaderboardPreferenceFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Current student-controlled leaderboard visibility preference.
 *
 * @property int $id
 * @property int $institution_id
 * @property int $user_id
 * @property LeaderboardScopeType $scope_type
 * @property bool $is_opted_in
 * @property int $version
 * @property Carbon $changed_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['*'])]
class LeaderboardPreference extends Model implements InstitutionOwned
{
    /** @use HasFactory<LeaderboardPreferenceFactory> */
    use HasFactory;

    public const SCOPE_TYPE = LeaderboardScopeType::Individual;

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    public function isIndividual(): bool
    {
        return $this->scope_type === self::SCOPE_TYPE;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'institution_id' => 'integer',
            'user_id' => 'integer',
            'scope_type' => LeaderboardScopeType::class,
            'is_opted_in' => 'boolean',
            'version' => 'integer',
            'changed_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
