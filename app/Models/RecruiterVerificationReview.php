<?php

namespace App\Models;

use App\Enums\RecruiterVerificationConclusion;
use Database\Factories\RecruiterVerificationReviewFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Append-only record of a platform admin's review of a recruiter organization.
 *
 * @property int $id
 * @property int $recruiter_organization_id
 * @property int $reviewer_id
 * @property RecruiterVerificationConclusion $conclusion
 * @property string|null $reason
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class RecruiterVerificationReview extends Model
{
    /** @use HasFactory<RecruiterVerificationReviewFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @return BelongsTo<RecruiterOrganization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(RecruiterOrganization::class, 'recruiter_organization_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Prevent an existing review from being persisted again.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Recruiter verification reviews are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Recruiter verification reviews are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'conclusion' => RecruiterVerificationConclusion::class,
            'created_at' => 'datetime',
        ];
    }
}
