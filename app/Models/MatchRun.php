<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Database\Factories\MatchRunFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * Persisted normalized input for one reproducible matching calculation.
 *
 * @property int $id
 * @property int $institution_id
 * @property int $actor_id
 * @property int $project_id
 * @property int $version_id
 * @property array<string, mixed> $input_snapshot
 * @property Carbon $computed_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Fillable(['institution_id', 'actor_id', 'project_id', 'version_id', 'input_snapshot', 'computed_at'])]
class MatchRun extends Model implements InstitutionOwned
{
    /** @use HasFactory<MatchRunFactory> */
    use HasFactory;

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
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return BelongsTo<MatchScoreVersion, $this>
     */
    public function version(): BelongsTo
    {
        return $this->belongsTo(MatchScoreVersion::class, 'version_id');
    }

    /**
     * @return HasOne<Recommendation, $this>
     */
    public function recommendation(): HasOne
    {
        return $this->hasOne(Recommendation::class);
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'input_snapshot' => 'array',
            'computed_at' => 'datetime',
        ];
    }
}
