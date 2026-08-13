<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BadgeRuleType;
use Database\Factories\BadgeRuleVersionFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Immutable rule definition with a controlled active flag.
 *
 * @property int $id
 * @property int $badge_definition_id
 * @property int $version
 * @property BadgeRuleType $rule_type
 * @property array<string, mixed> $criteria
 * @property string $policy_version
 * @property bool $is_active
 * @property int|null $created_by_id
 * @property Carbon|null $activated_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['*'])]
class BadgeRuleVersion extends Model
{
    /** @use HasFactory<BadgeRuleVersionFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<BadgeDefinition, $this>
     */
    public function definition(): BelongsTo
    {
        return $this->belongsTo(BadgeDefinition::class, 'badge_definition_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /**
     * @return HasMany<BadgeAward, $this>
     */
    public function awards(): HasMany
    {
        return $this->hasMany(BadgeAward::class);
    }

    public function isAutomatic(): bool
    {
        return $this->rule_type === BadgeRuleType::VerifiedContributionCount;
    }

    /**
     * Only activation state may change after a rule version is created.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists && $this->isDirty([
            'badge_definition_id',
            'version',
            'rule_type',
            'criteria',
            'policy_version',
            'created_by_id',
        ])) {
            throw new LogicException('Badge rule versions are immutable. Create a new version instead.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Badge rule versions are immutable.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rule_type' => BadgeRuleType::class,
            'criteria' => 'array',
            'version' => 'integer',
            'is_active' => 'boolean',
            'created_by_id' => 'integer',
            'activated_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
