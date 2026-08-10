<?php

namespace App\Models;

use Database\Factories\InstitutionRosterFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $institution_id
 * @property string $semester
 * @property string $source_filename
 * @property string $checksum
 * @property int $total_rows
 * @property int $valid_rows
 * @property int $error_rows
 * @property string $status
 * @property int|null $imported_by
 *
 * @method static \Database\Factories\InstitutionRosterFactory factory($count = null, $state = [])
 */
class InstitutionRoster extends Model
{
    /** @use HasFactory<InstitutionRosterFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * @return HasMany<InstitutionRosterRow, $this>
     */
    public function rows(): HasMany
    {
        return $this->hasMany(InstitutionRosterRow::class, 'roster_id');
    }

    /**
     * @param  Builder<InstitutionRoster>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'imported');
    }
}
