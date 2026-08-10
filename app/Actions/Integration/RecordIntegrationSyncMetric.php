<?php

namespace App\Actions\Integration;

use App\Enums\IntegrationSyncStatus;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncMetric;
use Illuminate\Support\Facades\DB;

/**
 * Updates the institution-scoped aggregate metric row for a sync lifecycle.
 *
 * The row is keyed by connection and is recorded once per sync when a terminal
 * state is reached, so operators can monitor queue age, retry volume, and
 * dead-letter counts without scanning raw sync history.
 */
final class RecordIntegrationSyncMetric
{
    public function record(IntegrationSync $sync): void
    {
        $metric = IntegrationSyncMetric::query()
            ->where('integration_connection_id', $sync->integration_connection_id)
            ->first();

        if ($metric === null) {
            $metric = new IntegrationSyncMetric;
            $metric->forceFill([
                'integration_connection_id' => $sync->integration_connection_id,
                'institution_id' => $sync->connection->institution_id,
            ]);
        }

        $metric->forceFill([
            'total_syncs' => ($metric->total_syncs ?? 0) + 1,
            'last_sync_at' => $sync->last_attempt_at ?? now(),
            'queue_age_seconds' => $metric->queue_age_seconds > 0
                ? $metric->queue_age_seconds
                : (int) $sync->created_at->diffInSeconds($sync->last_attempt_at ?? now()),
            'total_retries' => ($metric->total_retries ?? 0) + max(0, $sync->attempts - 1),
            'succeeded_count' => ($metric->succeeded_count ?? 0) + $this->countsToward($sync->status, IntegrationSyncStatus::Succeeded),
            'reconciled_count' => ($metric->reconciled_count ?? 0) + $this->countsToward($sync->status, IntegrationSyncStatus::Reconciled),
            'dead_letter_count' => ($metric->dead_letter_count ?? 0) + $this->countsToward($sync->status, IntegrationSyncStatus::Dead),
        ]);

        DB::transaction(fn () => $metric->save());
    }

    private function countsToward(IntegrationSyncStatus $status, IntegrationSyncStatus $target): int
    {
        return $status === $target ? 1 : 0;
    }
}
