<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\CollaborationEventType;
use Database\Factories\CollaborationEventFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Append-only record of a legitimate collaboration activity.
 *
 * Records metadata about who collaborated with whom, in what context.
 * Message content is never stored or analyzed.
 *
 * @property int $id
 * @property int $institution_id
 * @property int $actor_id
 * @property int|null $target_id
 * @property CollaborationEventType $event_type
 * @property string|null $context_type
 * @property int|null $context_id
 * @property Carbon $occurred_at
 * @property array<string, mixed>|null $metadata
 * @property bool $is_synthetic
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class CollaborationEvent extends Model implements InstitutionOwned
{
    /** @use HasFactory<CollaborationEventFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
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
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function target(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_id');
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function context(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope the query to a single explicit institution.
     *
     * @param  Builder<CollaborationEvent>  $query
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
     * Scope the query to events within a time window.
     *
     * @param  Builder<CollaborationEvent>  $query
     */
    #[Scope]
    protected function withinPeriod(Builder $query, Carbon $start, Carbon $end): void
    {
        $query->where('occurred_at', '>=', $start)
            ->where('occurred_at', '<=', $end);
    }

    /**
     * Scope the query to only real (non-synthetic) events.
     *
     * @param  Builder<CollaborationEvent>  $query
     */
    #[Scope]
    protected function realOnly(Builder $query): void
    {
        $query->where('is_synthetic', false);
    }

    /**
     * Scope the query to only synthetic events.
     *
     * @param  Builder<CollaborationEvent>  $query
     */
    #[Scope]
    protected function syntheticOnly(Builder $query): void
    {
        $query->where('is_synthetic', true);
    }

    /**
     * Prevent an existing event from being persisted again.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Collaboration events are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Collaboration events are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'event_type' => CollaborationEventType::class,
            'occurred_at' => 'datetime',
            'metadata' => 'array',
            'is_synthetic' => 'boolean',
            'created_at' => 'datetime',
        ];
    }
}
