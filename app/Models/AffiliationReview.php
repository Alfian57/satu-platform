<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\AffiliationRequestStatus;
use App\Enums\AffiliationReviewDecision;
use App\Enums\AffiliationReviewReason;
use Database\Factories\AffiliationReviewFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * @property int $id
 * @property int $affiliation_request_id
 * @property int $institution_id
 * @property int $reviewer_id
 * @property AffiliationReviewDecision $decision
 * @property AffiliationReviewReason $reason_code
 * @property string|null $note
 * @property string $policy_version
 * @property AffiliationRequestStatus $previous_status
 * @property AffiliationRequestStatus $new_status
 * @property int $request_version
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class AffiliationReview extends Model implements InstitutionOwned
{
    /** @use HasFactory<AffiliationReviewFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /** @return BelongsTo<AffiliationRequest, $this> */
    public function affiliationRequest(): BelongsTo
    {
        return $this->belongsTo(AffiliationRequest::class);
    }

    /** @return BelongsTo<Institution, $this> */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    /** @param array<string, mixed> $options */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Affiliation reviews are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Affiliation reviews are append-only.');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'decision' => AffiliationReviewDecision::class,
            'reason_code' => AffiliationReviewReason::class,
            'previous_status' => AffiliationRequestStatus::class,
            'new_status' => AffiliationRequestStatus::class,
            'created_at' => 'datetime',
        ];
    }
}
