<?php

namespace App\Actions\Integration;

use App\Enums\IntegrationSyncErrorClass;
use App\Enums\IntegrationSyncStatus;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncEvent;
use App\Support\Integration\AcademicGateway;
use App\Support\Integration\SyncErrorClassifier;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Performs a single sync attempt and records a classified outcome.
 *
 * Retry, backoff, and dead-letter orchestration live in the queue job so the
 * queue owns attempt policy while this action keeps the status contract stable.
 */
final class ProcessIntegrationSync
{
    public function __construct(
        private readonly AcademicGateway $gateway,
        private readonly SyncErrorClassifier $classifier = new SyncErrorClassifier,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function handle(IntegrationSync $sync, array $payload): ?IntegrationSyncErrorClass
    {
        if ($this->isTerminalSuccess($sync)) {
            return null;
        }

        $this->markAs($sync, IntegrationSyncStatus::Sending, 'Mengirim ke provider...');
        $sync->forceFill([
            'attempts' => $sync->attempts + 1,
            'last_attempt_at' => Carbon::now(),
        ])->save();

        try {
            $response = $this->gateway->sync($sync->connection, $payload);

            $sync->forceFill(['external_reference' => $response['reference'] ?? null])->save();
            $this->markAs($sync, IntegrationSyncStatus::Succeeded, 'Sinkronisasi berhasil.', $response);

            $this->log('academic.sync.succeeded', $sync, null);

            return null;
        } catch (ConnectionException $e) {
            return $this->classifyAndMark($sync, IntegrationSyncErrorClass::Timeout, $e);
        } catch (RequestException $e) {
            $class = $this->classifier->classifyHttpStatus($e->response->status());

            return $this->classifyAndMark($sync, $class, $e);
        } catch (Throwable $e) {
            return $this->classifyAndMark($sync, IntegrationSyncErrorClass::Permanent, $e);
        }
    }

    public function markDead(IntegrationSync $sync, string $reason): void
    {
        $this->markAs($sync, IntegrationSyncStatus::Dead, $reason);
        $this->log('academic.sync.dead', $sync, null);
    }

    private function classifyAndMark(IntegrationSync $sync, IntegrationSyncErrorClass $class, Throwable $e): IntegrationSyncErrorClass
    {
        if ($class === IntegrationSyncErrorClass::Duplicate) {
            $snapshot = $e instanceof RequestException ? $e->response->json() : null;
            $this->markAs($sync, IntegrationSyncStatus::Reconciled, 'Rekaman sudah ada; telah direkonsiliasi.', $snapshot);
            $this->log('academic.sync.reconciled', $sync, $class);

            return $class;
        }

        $status = match ($class) {
            IntegrationSyncErrorClass::Validation => IntegrationSyncStatus::ValidationError,
            IntegrationSyncErrorClass::Auth => IntegrationSyncStatus::Failed,
            IntegrationSyncErrorClass::Permanent => IntegrationSyncStatus::Dead,
            IntegrationSyncErrorClass::Timeout => IntegrationSyncStatus::Timeout,
            default => IntegrationSyncStatus::Retrying,
        };

        $snapshot = $e instanceof RequestException ? $e->response->json() : null;
        $this->markAs($sync, $status, $e->getMessage(), $snapshot);
        $this->log('academic.sync.failure', $sync, $class);

        return $class;
    }

    private function isTerminalSuccess(IntegrationSync $sync): bool
    {
        return in_array($sync->status, [
            IntegrationSyncStatus::Succeeded,
            IntegrationSyncStatus::Reconciled,
        ], true);
    }

    /**
     * @param  array<string, mixed>|null  $snapshot
     */
    private function markAs(IntegrationSync $sync, IntegrationSyncStatus $status, string $reason, ?array $snapshot = null): void
    {
        DB::transaction(function () use ($sync, $status, $reason, $snapshot) {
            $sync->forceFill(['status' => $status->value])->save();

            (new IntegrationSyncEvent)->forceFill([
                'integration_sync_id' => $sync->id,
                'status' => $status->value,
                'reason' => $reason,
                'payload_snapshot' => $snapshot,
            ])->save();
        });
    }

    private function log(string $channel, IntegrationSync $sync, ?IntegrationSyncErrorClass $class): void
    {
        Log::info($channel, [
            'sync_id' => $sync->id,
            'connection_id' => $sync->integration_connection_id,
            'institution_id' => $sync->connection->institution_id,
            'source' => $sync->source,
            'mapping_version' => $sync->mapping_version,
            'status' => $sync->status->value,
            'error_class' => $class?->value,
            'attempts' => $sync->attempts,
        ]);
    }
}
