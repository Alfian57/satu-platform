<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Database\Factories\BadgeAwardFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use LogicException;

/**
 * Institution-scoped badge award with immutable provenance and revocation state.
 *
 * @property int $id
 * @property int $user_id
 * @property int $institution_id
 * @property int $badge_definition_id
 * @property int $badge_rule_version_id
 * @property string $source_type
 * @property int $source_id
 * @property int|null $source_version_id
 * @property string $source_label
 * @property string|null $reason
 * @property string $idempotency_key
 * @property Carbon $awarded_at
 * @property Carbon|null $revoked_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['*'])]
class BadgeAward extends Model implements InstitutionOwned
{
    /** @use HasFactory<BadgeAwardFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * @return BelongsTo<BadgeDefinition, $this>
     */
    public function definition(): BelongsTo
    {
        return $this->belongsTo(BadgeDefinition::class, 'badge_definition_id');
    }

    /**
     * @return BelongsTo<BadgeRuleVersion, $this>
     */
    public function ruleVersion(): BelongsTo
    {
        return $this->belongsTo(BadgeRuleVersion::class, 'badge_rule_version_id');
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<ContributionVersion, $this>
     */
    public function sourceVersion(): BelongsTo
    {
        return $this->belongsTo(ContributionVersion::class, 'source_version_id');
    }

    /**
     * @return HasOne<BadgeRevocation, $this>
     */
    public function revocation(): HasOne
    {
        return $this->hasOne(BadgeRevocation::class, 'badge_award_id');
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    /**
     * Return the safe contribution provenance used in public explanations.
     * Private evidence is intentionally never loaded or serialized here.
     *
     * @return array{type: string, id: int, version: int|null, label: string}
     */
    public function sourceExplanation(): array
    {
        return [
            'type' => Str::afterLast($this->source_type, '\\'),
            'id' => $this->source_id,
            'version' => $this->source_version_id === null ? null : $this->sourceVersion?->version_number,
            'label' => $this->source_label,
        ];
    }

    /**
     * Preserve award history while allowing the single revocation timestamp to be set.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists && $this->isDirty([
            'user_id',
            'institution_id',
            'badge_definition_id',
            'badge_rule_version_id',
            'source_type',
            'source_id',
            'source_version_id',
            'source_label',
            'reason',
            'idempotency_key',
            'awarded_at',
        ])) {
            throw new LogicException('Badge awards are immutable except for revocation state.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Badge awards are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'institution_id' => 'integer',
            'badge_definition_id' => 'integer',
            'badge_rule_version_id' => 'integer',
            'source_id' => 'integer',
            'source_version_id' => 'integer',
            'awarded_at' => 'datetime',
            'revoked_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
