<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Database\Factories\BadgeRevocationFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Append-only badge revocation event.
 *
 * @property int $id
 * @property int $badge_award_id
 * @property int $actor_id
 * @property string $reason
 * @property Carbon $revoked_at
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class BadgeRevocation extends Model implements InstitutionOwned
{
    /** @use HasFactory<BadgeRevocationFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @return BelongsTo<BadgeAward, $this>
     */
    public function award(): BelongsTo
    {
        return $this->belongsTo(BadgeAward::class, 'badge_award_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function institutionId(): int
    {
        return (int) $this->award->institution_id;
    }

    /**
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Badge revocations are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Badge revocations are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'badge_award_id' => 'integer',
            'actor_id' => 'integer',
            'revoked_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }
}
