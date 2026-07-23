<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\ConsentRecordFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * @property int $id
 * @property int $user_id
 * @property string $purpose
 * @property string $policy_version
 * @property string $source
 * @property CarbonInterface|null $granted_at
 * @property CarbonInterface|null $withdrawn_at
 * @property CarbonInterface $occurred_at
 * @property CarbonInterface $created_at
 */
#[Guarded(['*'])]
class ConsentRecord extends Model
{
    /** @use HasFactory<ConsentRecordFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param  Builder<ConsentRecord>  $query
     */
    #[Scope]
    protected function forUser(Builder $query, User|int $user): void
    {
        $query->where(
            'user_id',
            $user instanceof User ? $user->getKey() : $user,
        );
    }

    /**
     * @param  Builder<ConsentRecord>  $query
     */
    #[Scope]
    protected function forPurpose(Builder $query, string $purpose): void
    {
        $query->where('purpose', $purpose);
    }

    /**
     * @param  Builder<ConsentRecord>  $query
     */
    #[Scope]
    protected function latestEvent(Builder $query): void
    {
        $query
            ->orderByDesc('occurred_at')
            ->orderByDesc('id');
    }

    public function isGrant(): bool
    {
        return $this->granted_at !== null;
    }

    public function occurredAt(): CarbonInterface
    {
        return $this->occurred_at;
    }

    /**
     * Prevent an existing consent event from being persisted again.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Consent records are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Consent records are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
            'withdrawn_at' => 'datetime',
            'occurred_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }
}
