<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\MatchingDimension;
use Database\Factories\MatchScoreVersionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Immutable versioned matching configuration.
 *
 * @property int $id
 * @property string $version
 * @property array<string, float> $weights
 * @property list<string> $dimensions
 * @property array{availability_target_minutes: int, connectivity_cap: int} $parameters
 * @property Carbon|null $activated_at
 * @property int|null $author_id
 * @property string|null $notes
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Fillable(['version', 'weights', 'dimensions', 'parameters', 'activated_at', 'author_id', 'notes'])]
class MatchScoreVersion extends Model
{
    /** @use HasFactory<MatchScoreVersionFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * @return HasMany<MatchRun, $this>
     */
    public function runs(): HasMany
    {
        return $this->hasMany(MatchRun::class, 'version_id');
    }

    public function weightFor(MatchingDimension $dimension): float
    {
        return (float) ($this->weights[$dimension->value] ?? 0.0);
    }

    public static function current(): ?self
    {
        return static::query()
            ->whereNotNull('activated_at')
            ->where('activated_at', '<=', now())
            ->orderByDesc('activated_at')
            ->orderByDesc('id')
            ->first();
    }

    /**
     * @return list<MatchingDimension>
     */
    public function supportedDimensions(): array
    {
        return array_values(array_filter(
            array_map(
                static fn (string $dimension): ?MatchingDimension => MatchingDimension::tryFrom($dimension),
                $this->dimensions,
            ),
            static fn (?MatchingDimension $dimension): bool => $dimension !== null,
        ));
    }

    /**
     * Prevent changes to an existing version's configuration.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if (
            $this->exists
            && $this->isDirty([
                'version',
                'weights',
                'dimensions',
                'parameters',
                'activated_at',
                'author_id',
                'notes',
            ])
        ) {
            throw new LogicException('Match score versions are immutable. Create a new version instead.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Match score versions are immutable.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weights' => 'array',
            'dimensions' => 'array',
            'parameters' => 'array',
            'activated_at' => 'datetime',
        ];
    }
}
