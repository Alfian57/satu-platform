<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\InstitutionMembershipReviewOutcome;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use Database\Factories\InstitutionMembershipFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $institution_id
 * @property InstitutionMembershipRole $role
 * @property InstitutionMembershipStatus $status
 * @property string|null $institutional_identifier
 * @property Carbon|null $requested_at
 * @property Carbon|null $reviewed_at
 * @property int|null $reviewed_by_id
 * @property Carbon|null $verified_at
 * @property InstitutionMembershipVerificationMethod|null $verification_method
 * @property InstitutionMembershipReviewOutcome|null $last_review_outcome
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['institutional_identifier'])]
class InstitutionMembership extends Model implements InstitutionOwned
{
    /** @use HasFactory<InstitutionMembershipFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => InstitutionMembershipRole::Student->value,
        'status' => InstitutionMembershipStatus::Unverified->value,
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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

    /**
     * Scope the query to a single explicit institution.
     *
     * @param  Builder<InstitutionMembership>  $query
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
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_id');
    }

    /**
     * @return HasOne<AffiliationRequest, $this>
     */
    public function affiliationRequest(): HasOne
    {
        return $this->hasOne(AffiliationRequest::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => InstitutionMembershipRole::class,
            'status' => InstitutionMembershipStatus::class,
            'requested_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'verified_at' => 'datetime',
            'verification_method' => InstitutionMembershipVerificationMethod::class,
            'last_review_outcome' => InstitutionMembershipReviewOutcome::class,
        ];
    }
}
