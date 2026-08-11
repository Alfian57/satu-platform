<?php

namespace App\Actions\Integration;

use App\Enums\IntegrationSyncStatus;
use App\Jobs\SyncAcademicActivity;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSync;

/**
 * Builds a versioned, idempotent sync candidate and dispatches its queue job.
 */
final class DispatchAcademicSync
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function execute(
        IntegrationConnection $connection,
        string $source,
        string $mappingVersion,
        string $idempotencyKey,
        array $payload,
    ): IntegrationSync {
        $envelope = $this->buildEnvelope($mappingVersion, $idempotencyKey, $payload);

        $existing = IntegrationSync::query()
            ->where('integration_connection_id', $connection->id)
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existing !== null) {
            if (in_array($existing->status, [
                IntegrationSyncStatus::Succeeded,
                IntegrationSyncStatus::Reconciled,
            ], true)) {
                return $existing;
            }

            SyncAcademicActivity::dispatch($existing->id, $envelope);

            return $existing;
        }

        $sync = new IntegrationSync;
        $sync->forceFill([
            'integration_connection_id' => $connection->id,
            'source' => $source,
            'mapping_version' => $mappingVersion,
            'idempotency_key' => $idempotencyKey,
            'payload_digest' => hash('sha256', (string) json_encode($envelope)),
        ])->save();

        SyncAcademicActivity::dispatch($sync->id, $envelope);

        return $sync;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function buildEnvelope(string $mappingVersion, string $idempotencyKey, array $payload): array
    {
        return array_merge($payload, [
            'mapping_version' => $mappingVersion,
            'idempotency_key' => $idempotencyKey,
        ]);
    }
}
