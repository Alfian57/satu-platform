<?php

namespace App\Models;

use App\Enums\InclusionReviewConclusion;
use Database\Factories\InclusionReviewFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Append-only record of a human review decision on an inclusion signal.
 *
 * @property int $id
 * @property int $inclusion_signal_id
 * @property int $reviewer_id
 * @property InclusionReviewConclusion $conclusion
 * @property string|null $support_action
 * @property string|null $reason
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class InclusionReview extends Model
{
    /** @use HasFactory<InclusionReviewFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @return BelongsTo<InclusionSignal, $this>
     */
    public function signal(): BelongsTo
    {
        return $this->belongsTo(InclusionSignal::class, 'inclusion_signal_id');
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
            throw new LogicException('Inclusion reviews are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Inclusion reviews are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'conclusion' => InclusionReviewConclusion::class,
            'created_at' => 'datetime',
        ];
    }
}
