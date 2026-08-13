<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\ContributionStatus;
use App\Enums\PortfolioVerificationLevel;
use App\Enums\PortfolioVisibility;
use Database\Factories\PortfolioEntryFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Tenant-scoped portfolio projection sourced from an approved contribution.
 *
 * @property int $id
 * @property int $institution_id
 * @property int $user_id
 * @property int $contribution_id
 * @property int $contribution_version_id
 * @property string $title
 * @property string $summary
 * @property PortfolioVerificationLevel $verification_level
 * @property PortfolioVisibility $visibility
 * @property Carbon|null $published_at
 * @property Carbon|null $withdrawn_at
 * @property string|null $withdrawal_reason
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded([
    'id',
    'institution_id',
    'user_id',
    'contribution_id',
    'contribution_version_id',
    'verification_level',
    'published_at',
    'withdrawn_at',
    'withdrawal_reason',
    'created_at',
    'updated_at',
])]
class PortfolioEntry extends Model implements InstitutionOwned
{
    /** @use HasFactory<PortfolioEntryFactory> */
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
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsTo<Contribution, $this>
     */
    public function contribution(): BelongsTo
    {
        return $this->belongsTo(Contribution::class);
    }

    /**
     * @return BelongsTo<ContributionVersion, $this>
     */
    public function sourceVersion(): BelongsTo
    {
        return $this->belongsTo(ContributionVersion::class, 'contribution_version_id');
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    public function isWithdrawn(): bool
    {
        return $this->withdrawn_at !== null;
    }

    public function isRecruiterVisible(): bool
    {
        return ! $this->isWithdrawn()
            && in_array($this->visibility, [
                PortfolioVisibility::Recruiter,
                PortfolioVisibility::Public,
            ], true);
    }

    /**
     * Scope entries to one institution.
     *
     * @param  Builder<PortfolioEntry>  $query
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
     * Scope entries whose source is the current approved contribution version.
     *
     * @param  Builder<PortfolioEntry>  $query
     */
    #[Scope]
    protected function approvedCurrent(Builder $query): void
    {
        $contributionTable = (new Contribution)->getTable();
        $entryTable = $query->getModel()->getTable();

        $query->whereHas('contribution', function (Builder $contributionQuery) use (
            $contributionTable,
            $entryTable,
        ): void {
            $contributionQuery
                ->where('status', ContributionStatus::Approved->value)
                ->whereColumn(
                    "{$contributionTable}.current_version_id",
                    "{$entryTable}.contribution_version_id",
                );
        });
    }

    /**
     * Scope entries that may be included in recruiter-safe projections.
     *
     * @param  Builder<PortfolioEntry>  $query
     */
    #[Scope]
    protected function visibleToRecruiter(Builder $query): void
    {
        $query
            ->approvedCurrent()
            ->whereNull('withdrawn_at')
            ->whereIn('visibility', [
                PortfolioVisibility::Recruiter->value,
                PortfolioVisibility::Public->value,
            ]);
    }

    /**
     * Scope entries that may be rendered on a public portfolio surface.
     *
     * @param  Builder<PortfolioEntry>  $query
     */
    #[Scope]
    protected function visibleToPublic(Builder $query): void
    {
        $query
            ->approvedCurrent()
            ->whereNull('withdrawn_at')
            ->where('visibility', PortfolioVisibility::Public->value);
    }

    /**
     * Scope entries visible to another verified student in the institution.
     *
     * @param  Builder<PortfolioEntry>  $query
     */
    #[Scope]
    protected function visibleToInstitution(Builder $query): void
    {
        $query
            ->approvedCurrent()
            ->whereNull('withdrawn_at')
            ->whereIn('visibility', [
                PortfolioVisibility::Institution->value,
                PortfolioVisibility::Public->value,
            ]);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'verification_level' => PortfolioVerificationLevel::class,
            'visibility' => PortfolioVisibility::class,
            'published_at' => 'datetime',
            'withdrawn_at' => 'datetime',
        ];
    }
}
