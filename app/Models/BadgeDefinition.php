<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BadgeCategory;
use Database\Factories\BadgeDefinitionFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Immutable public badge taxonomy definition.
 *
 * @property int $id
 * @property string $key
 * @property BadgeCategory $category
 * @property int $level
 * @property string $public_name
 * @property string $public_description
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Guarded(['*'])]
class BadgeDefinition extends Model
{
    /** @use HasFactory<BadgeDefinitionFactory> */
    use HasFactory;

    /**
     * @return HasMany<BadgeRuleVersion, $this>
     */
    public function ruleVersions(): HasMany
    {
        return $this->hasMany(BadgeRuleVersion::class);
    }

    /**
     * @return HasMany<BadgeAward, $this>
     */
    public function awards(): HasMany
    {
        return $this->hasMany(BadgeAward::class);
    }

    /**
     * Taxonomy definitions are replaced by a new key instead of edited in place.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Badge definitions are immutable. Create a new definition instead.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Badge definitions are immutable.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => BadgeCategory::class,
            'level' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
