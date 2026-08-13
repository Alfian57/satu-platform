<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Database\Factories\ContributionVersionFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Immutable contribution claim and provenance snapshot.
 *
 * @property int $id
 * @property int $contribution_id
 * @property int $created_by_id
 * @property int $task_id
 * @property int $version_number
 * @property string $claim
 * @property string $summary
 * @property string $declaration
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class ContributionVersion extends Model implements InstitutionOwned
{
    /** @use HasFactory<ContributionVersionFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @return BelongsTo<Contribution, $this>
     */
    public function contribution(): BelongsTo
    {
        return $this->belongsTo(Contribution::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /**
     * @return BelongsTo<Task, $this>
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * @return HasMany<ContributionEvidence, $this>
     */
    public function evidence(): HasMany
    {
        return $this->hasMany(ContributionEvidence::class);
    }

    /**
     * @return HasMany<ContributionReview, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(ContributionReview::class);
    }

    public function institutionId(): int
    {
        return (int) $this->contribution->institution_id;
    }

    /**
     * Prevent changes to an existing version. Create a new version instead.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists && $this->isDirty([
            'contribution_id',
            'created_by_id',
            'task_id',
            'version_number',
            'claim',
            'summary',
            'declaration',
        ])) {
            throw new LogicException('Contribution versions are immutable. Create a new version instead.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Contribution versions are immutable.');
    }
}
