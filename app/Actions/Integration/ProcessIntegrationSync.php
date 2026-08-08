<?php

namespace App\Actions\Integration;

use App\Enums\IntegrationSyncStatus;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncEvent;
use App\Support\Integration\AcademicGateway;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class ProcessIntegrationSync
{
    public function __construct(
        private readonly AcademicGateway $gateway,
    ) {}

    /**
     * @param array<string, mixed> $payload
     */
    public function handle(IntegrationSync $sync, array $payload): void
    {
        if ($sync->attempts >= 3) {
            $this->markAs($sync, IntegrationSyncStatus::Dead, 'Max attempts reached.');

            return;
        }

        $this->markAs($sync, IntegrationSyncStatus::Sending, 'Sending to provider...');
        $sync->forceFill([
            'attempts' => $sync->attempts + 1,
            'last_attempt_at' => Carbon::now(),
        ])->save();

        try {
            $response = $this->gateway->sync($sync->connection, $payload);

            $sync->forceFill(['external_reference' => $response['reference'] ?? null])->save();
            $this->markAs($sync, IntegrationSyncStatus::Succeeded, 'Sync successful.', $response);
        } catch (ConnectionException $e) {
            $this->markAs($sync, IntegrationSyncStatus::Timeout, $e->getMessage());
        } catch (RequestException $e) {
            $response = $e->response;
            $status = $response->status();

            if ($status === 422) {
                $this->markAs($sync, IntegrationSyncStatus::ValidationError, 'Validation error.', $response->json());
            } elseif ($status === 409) {
                $this->markAs($sync, IntegrationSyncStatus::Conflict, 'Record already exists.', $response->json());
            } else {
                $this->markAs($sync, IntegrationSyncStatus::Failed, 'Provider error: '.$status, $response->json());
            }
        } catch (\Throwable $e) {
            $this->markAs($sync, IntegrationSyncStatus::Failed, $e->getMessage());
        }
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
}
