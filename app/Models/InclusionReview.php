<?php

namespace App\Models;

use Database\Factories\InclusionReviewFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property InclusionSignal $signal
 */
class InclusionReview extends Model
{
    /** @use HasFactory<InclusionReviewFactory> */
    use HasFactory;

    protected $guarded = [];

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
}
