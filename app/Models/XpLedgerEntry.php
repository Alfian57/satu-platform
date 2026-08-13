<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\InstitutionOwned;
use Database\Factories\XpLedgerEntryFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Immutable, institution-scoped verified XP ledger entry.
 *
 * @property int $id
 * @property int $user_id
 * @property int $institution_id
 * @property string $semester
 * @property int $amount
 * @property string $reason
 * @property string $source_type
 * @property int $source_id
 * @property string $policy_version
 * @property Carbon $awarded_at
 * @property int|null $reversal_reference_id
 * @property string $idempotency_key
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class XpLedgerEntry extends Model implements InstitutionOwned
{
    /** @use HasFactory<XpLedgerEntryFactory> */
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
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<self, $this>
     */
    public function reversalReference(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reversal_reference_id');
    }

    /**
     * @return HasMany<self, $this>
     */
    public function reversals(): HasMany
    {
        return $this->hasMany(self::class, 'reversal_reference_id');
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    public function isReversal(): bool
    {
        return $this->reversal_reference_id !== null;
    }

    /**
     * @param  Builder<self>  $query
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
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function forUserAndSemester(
        Builder $query,
        User|int $user,
        string $semester,
    ): void {
        $query
            ->where('user_id', $user instanceof User ? $user->getKey() : $user)
            ->where('semester', $semester);
    }

    /**
     * Select the signed net total while preserving positive amounts on reversal rows.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function withNetAmount(Builder $query): void
    {
        $query->selectRaw(
            'COALESCE(SUM(CASE WHEN reversal_reference_id IS NULL THEN amount ELSE -amount END), 0) AS net_amount',
        );
    }

    /**
     * XP history cannot be updated or deleted. Corrections are new ledger rows.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('XP ledger entries are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('XP ledger entries are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'institution_id' => 'integer',
            'amount' => 'integer',
            'source_id' => 'integer',
            'awarded_at' => 'datetime',
            'reversal_reference_id' => 'integer',
            'created_at' => 'datetime',
        ];
    }
}
