<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\InstitutionRosterStatus;
use Database\Factories\InstitutionRosterFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $institution_id
 * @property string $semester
 * @property string $source_filename
 * @property string $checksum
 * @property int $total_rows
 * @property int $valid_rows
 * @property int $error_rows
 * @property InstitutionRosterStatus $status
 * @property int|null $imported_by
 * @property Carbon|null $activated_at
 * @property Carbon|null $superseded_at
 *
 * @method static \Database\Factories\InstitutionRosterFactory factory($count = null, $state = [])
 */
#[Guarded(['*'])]
class InstitutionRoster extends Model implements InstitutionOwned
{
    /** @use HasFactory<InstitutionRosterFactory> */
    use HasFactory;

    /** @var array<string, mixed> */
    protected $attributes = [
        'status' => InstitutionRosterStatus::Active->value,
    ];

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

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    /**
     * @param  Builder<InstitutionRoster>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', InstitutionRosterStatus::Active);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => InstitutionRosterStatus::class,
            'activated_at' => 'datetime',
            'superseded_at' => 'datetime',
        ];
    }
}
