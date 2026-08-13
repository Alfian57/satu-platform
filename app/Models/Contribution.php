<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\ContributionStatus;
use Database\Factories\ContributionFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * Tenant-scoped contribution receipt with a mutable lifecycle pointer.
 *
 * @property int $id
 * @property int $institution_id
 * @property int $owner_id
 * @property int $project_id
 * @property ContributionStatus $status
 * @property int|null $current_version_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['id', 'institution_id', 'owner_id', 'project_id', 'created_at', 'updated_at'])]
class Contribution extends Model implements InstitutionOwned
{
    /** @use HasFactory<ContributionFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => ContributionStatus::Draft->value,
    ];

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
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return BelongsTo<ContributionVersion, $this>
     */
    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(ContributionVersion::class, 'current_version_id');
    }

    /**
     * @return HasMany<ContributionVersion, $this>
     */
    public function versions(): HasMany
    {
        return $this->hasMany(ContributionVersion::class)->orderBy('version_number');
    }

    /**
     * @return HasManyThrough<ContributionEvidence, ContributionVersion, $this>
     */
    public function evidence(): HasManyThrough
    {
        return $this->hasManyThrough(
            ContributionEvidence::class,
            ContributionVersion::class,
            'contribution_id',
            'contribution_version_id',
        );
    }

    /**
     * @return HasManyThrough<ContributionReview, ContributionVersion, $this>
     */
    public function reviews(): HasManyThrough
    {
        return $this->hasManyThrough(
            ContributionReview::class,
            ContributionVersion::class,
            'contribution_id',
            'contribution_version_id',
        );
    }

    /**
     * @return HasOne<PortfolioEntry, $this>
     */
    public function portfolioEntry(): HasOne
    {
        return $this->hasOne(PortfolioEntry::class);
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    public function canCreateVersion(): bool
    {
        return $this->status->canCreateVersion();
    }

    /**
     * @param  Builder<Contribution>  $query
     */
    #[Scope]
    protected function forInstitution(Builder $query, Institution|int $institution): void
    {
        $query->where(
            'institution_id',
            $institution instanceof Institution ? $institution->getKey() : $institution,
        );
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ContributionStatus::class,
            'current_version_id' => 'integer',
        ];
    }
}
