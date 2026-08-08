<?php

namespace App\Models;

use App\Enums\IntegrationSyncStatus;
use Database\Factories\IntegrationSyncEventFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * Append-only record of a sync status change or attempt.
 *
 * @property int $id
 * @property int $integration_sync_id
 * @property IntegrationSyncStatus $status
 * @property string|null $reason
 * @property array<string, mixed>|null $payload_snapshot
 * @property Carbon $created_at
 */
#[Guarded(['*'])]
class IntegrationSyncEvent extends Model
{
    /** @use HasFactory<IntegrationSyncEventFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @return BelongsTo<IntegrationSync, $this>
     */
    public function sync(): BelongsTo
    {
        return $this->belongsTo(IntegrationSync::class, 'integration_sync_id');
    }

    /**
     * Prevent an existing event from being persisted again.
     *
     * @param  array<string, mixed>  $options
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('Integration sync events are append-only.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('Integration sync events are append-only.');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => IntegrationSyncStatus::class,
            'payload_snapshot' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
