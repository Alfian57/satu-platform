<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\InclusionSignalStatus;
use Database\Factories\InclusionSignalFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Restricted operational review signal for inclusion support.
 *
 * Exposes patterns of participation that may need support, without
 * making mental health diagnoses or automatic adverse actions.
 *
 * @property int $id
 * @property int $institution_id
 * @property int $subject_id
 * @property string $version
 * @property Carbon $period_start
 * @property Carbon $period_end
 * @property InclusionSignalStatus $status
 * @property array<string, mixed> $evidence_summary
 * @property bool $is_synthetic
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['*'])]
class InclusionSignal extends Model implements InstitutionOwned
{
    /** @use HasFactory<InclusionSignalFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => InclusionSignalStatus::New->value,
        'is_synthetic' => false,
    ];

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
     * @return BelongsTo<User, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subject_id');
    }

    /**
     * @return HasMany<InclusionReview, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(InclusionReview::class);
    }

    /**
     * Scope the query to a single explicit institution.
     *
     * @param  Builder<InclusionSignal>  $query
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
     * Scope the query to only real (non-synthetic) signals.
     *
     * @param  Builder<InclusionSignal>  $query
     */
    #[Scope]
    protected function realOnly(Builder $query): void
    {
        $query->where('is_synthetic', false);
    }

    /**
     * Scope the query to only synthetic signals.
     *
     * @param  Builder<InclusionSignal>  $query
     */
    #[Scope]
    protected function syntheticOnly(Builder $query): void
    {
        $query->where('is_synthetic', true);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period_start' => 'datetime',
            'period_end' => 'datetime',
            'status' => InclusionSignalStatus::class,
            'evidence_summary' => 'array',
            'is_synthetic' => 'boolean',
        ];
    }
}
