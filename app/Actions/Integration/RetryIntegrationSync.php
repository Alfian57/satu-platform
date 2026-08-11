<?php

declare(strict_types=1);

namespace App\Actions\Integration;

use App\Enums\IntegrationSyncStatus;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Safely re-queues a failed sync for another attempt without duplicating
 * already-succeeded records.
 *
 * Only non-terminal recipients can be retried. Re-dispatch is idempotent via
 * the connection + idempotency key, and the existing queue job owns retry,
 * backoff, and dead-letter policy.
 */
final class RetryIntegrationSync
{
    public function __construct(
        private readonly DispatchAcademicSync $dispatch,
    ) {}

    public function execute(User $operator, IntegrationSync $sync): IntegrationSync
    {
        if ($sync->status === IntegrationSyncStatus::Succeeded
            || $sync->status === IntegrationSyncStatus::Reconciled) {
            throw new InvalidArgumentException('Sync yang sudah berhasil tidak dapat diulang.');
        }

        $sync->loadMissing('connection');

        return DB::transaction(function () use ($operator, $sync) {
            $sync->forceFill([
                'status' => IntegrationSyncStatus::Queued->value,
            ])->save();

            (new IntegrationSyncEvent)->forceFill([
                'integration_sync_id' => $sync->id,
                'status' => IntegrationSyncStatus::Queued->value,
                'reason' => 'Dijalankan ulang oleh operator '.($operator->name ?: 'kampus').'.',
            ])->save();

            $this->dispatch->execute(
                connection: $sync->connection,
                source: $sync->source,
                mappingVersion: $sync->mapping_version,
                idempotencyKey: $sync->idempotency_key,
                payload: [
                    'simulate' => 'retry',
                ],
            );

            return $sync->fresh();
        });
    }
}
