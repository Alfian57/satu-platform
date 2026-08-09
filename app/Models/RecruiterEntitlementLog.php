<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Append-only record of changes to a recruiter entitlement.
 *
 * @property int $id
 * @property int $recruiter_entitlement_id
 * @property int $actor_id
 * @property string $event
 * @property string|null $reason
 * @property Carbon $created_at
 */
#[Fillable(['recruiter_entitlement_id', 'actor_id', 'event', 'reason'])]
class RecruiterEntitlementLog extends Model
{
    public const UPDATED_AT = null;

    /**
     * @return BelongsTo<RecruiterEntitlement, $this>
     */
    public function entitlement(): BelongsTo
    {
        return $this->belongsTo(RecruiterEntitlement::class, 'recruiter_entitlement_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Prevent an existing log entry from being updated.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Recruiter entitlement logs are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Recruiter entitlement logs are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }
}
