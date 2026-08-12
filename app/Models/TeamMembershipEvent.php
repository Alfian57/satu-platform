<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\TeamMembershipEventType;
use Database\Factories\TeamMembershipEventFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Append-only membership history entry.
 *
 * @property int $id
 * @property int $team_membership_id
 * @property int|null $actor_id
 * @property TeamMembershipEventType $event
 * @property string|null $reason
 * @property array<string, mixed>|null $metadata
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class TeamMembershipEvent extends Model
{
    /** @use HasFactory<TeamMembershipEventFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @return BelongsTo<TeamMembership, $this>
     */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(TeamMembership::class, 'team_membership_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Prevent a history entry from being changed after it is recorded.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Team membership events are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Team membership events are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'event' => TeamMembershipEventType::class,
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
