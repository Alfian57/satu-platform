<?php

namespace App\Models;

use Database\Factories\InclusionSignalFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InclusionSignal extends Model
{
    /** @use HasFactory<InclusionSignalFactory> */
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'evidence_summary' => 'array',
        'restricted_feature_state' => 'boolean',
        'data_sufficiency_met' => 'boolean',
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
    public function subject(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subject_id');
    }

    /**
     * @return BelongsTo<InclusionSignalVersion, $this>
     */
    public function version(): BelongsTo
    {
        return $this->belongsTo(InclusionSignalVersion::class, 'version_id');
    }

    /**
     * @return HasMany<InclusionReview, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(InclusionReview::class);
    }
}
