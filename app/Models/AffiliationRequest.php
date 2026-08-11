<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\AffiliationMatchResult;
use App\Enums\AffiliationRequestStatus;
use Database\Factories\AffiliationRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $institution_id
 * @property int $user_id
 * @property int $institution_membership_id
 * @property int|null $roster_id
 * @property int|null $roster_row_id
 * @property string $nim_hash
 * @property string $nim
 * @property AffiliationMatchResult $match_result
 * @property AffiliationRequestStatus $status
 * @property int $version
 * @property int|null $review_locked_by_id
 * @property Carbon|null $review_locked_at
 * @property Carbon|null $review_lock_expires_at
 * @property Carbon $submitted_at
 * @property Carbon|null $resolved_at
 */
#[Guarded(['*'])]
#[Hidden(['nim', 'nim_hash'])]
class AffiliationRequest extends Model implements InstitutionOwned
{
    /** @use HasFactory<AffiliationRequestFactory> */
    use HasFactory;

    /** @var array<string, mixed> */
    protected $attributes = [
        'status' => AffiliationRequestStatus::PendingReview->value,
        'version' => 1,
    ];

    /** @return BelongsTo<Institution, $this> */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<InstitutionMembership, $this> */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(InstitutionMembership::class, 'institution_membership_id');
    }

    /** @return BelongsTo<InstitutionRoster, $this> */
    public function roster(): BelongsTo
    {
        return $this->belongsTo(InstitutionRoster::class);
    }

    /** @return BelongsTo<InstitutionRosterRow, $this> */
    public function rosterRow(): BelongsTo
    {
        return $this->belongsTo(InstitutionRosterRow::class);
    }

    /** @return BelongsTo<User, $this> */
    public function lockOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'review_locked_by_id');
    }

    /** @return HasMany<AffiliationReview, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(AffiliationReview::class);
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    public function maskedNim(): string
    {
        $visible = min(3, Str::length($this->nim));

        return str_repeat('*', max(Str::length($this->nim) - $visible, 3))
            .Str::substr($this->nim, -$visible);
    }

    public function isReviewLockActive(): bool
    {
        return $this->review_locked_by_id !== null
            && $this->review_lock_expires_at?->isFuture() === true;
    }

    public function isStaleAgainst(?InstitutionRoster $activeRoster): bool
    {
        return $this->status === AffiliationRequestStatus::PendingReview
            && $this->roster_id !== $activeRoster?->getKey();
    }

    /** @param Builder<AffiliationRequest> $query */
    #[Scope]
    protected function forInstitution(Builder $query, Institution|int $institution): void
    {
        $query->where(
            'institution_id',
            $institution instanceof Institution ? $institution->getKey() : $institution,
        );
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'nim' => 'encrypted',
            'match_result' => AffiliationMatchResult::class,
            'status' => AffiliationRequestStatus::class,
            'review_locked_at' => 'datetime',
            'review_lock_expires_at' => 'datetime',
            'submitted_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }
}
