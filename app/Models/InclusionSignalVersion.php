<?php

namespace App\Models;

use Database\Factories\InclusionSignalVersionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InclusionSignalVersion extends Model
{
    /** @use HasFactory<InclusionSignalVersionFactory> */
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'metrics' => 'array',
        'rules' => 'array',
    ];

    /**
     * @return HasMany<InclusionSignal, $this>
     */
    public function signals(): HasMany
    {
        return $this->hasMany(InclusionSignal::class, 'version_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
