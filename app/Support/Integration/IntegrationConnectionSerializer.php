<?php

declare(strict_types=1);

namespace App\Support\Integration;

use App\Enums\IntegrationConnectionStatus;
use App\Enums\IntegrationProviderMode;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncEvent;
use Illuminate\Support\Str;

/**
 * Safe, allowlisted projection of academic integration data for campus operators.
 *
 * No provider secret, encrypted config, token, raw payload, or stack trace is
 * ever serialized. Errors surface as a short sanitized reason only.
 */
final class IntegrationConnectionSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function connection(IntegrationConnection $connection): array
    {
        $connection->loadMissing('syncs');

        return [
            'id' => $connection->id,
            'institution_id' => $connection->institution_id,
            'provider_key' => $connection->provider_key,
            'mode' => $connection->mode->value,
            'mode_label' => $this->modeLabel($connection->mode),
            'status' => $connection->status->value,
            'status_label' => $this->connectionStatusLabel($connection->status),
            'sync_count' => $connection->syncs->count(),
            'created_at' => $connection->created_at->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function sync(IntegrationSync $sync): array
    {
        $sync->loadMissing(['connection', 'events']);
        $latestEvent = $sync->events->last();

        return [
            'id' => $sync->id,
            'connection_id' => $sync->integration_connection_id,
            'connection_provider' => $sync->connection?->provider_key,
            'source' => $sync->source,
            'mapping_version' => $sync->mapping_version,
            'idempotency_key' => $sync->idempotency_key,
            'payload_digest_short' => Str::limit($sync->payload_digest, 16),
            'status' => $sync->status->value,
            'attempts' => $sync->attempts,
            'external_reference' => $sync->external_reference,
            'last_attempt_at' => $sync->last_attempt_at?->toIso8601String(),
            'created_at' => $sync->created_at->toIso8601String(),
            'error' => $latestEvent !== null ? $this->sanitizedError($latestEvent) : null,
            'timeline' => $sync->events->map(
                fn (IntegrationSyncEvent $event): array => [
                    'status' => $event->status->value,
                    'reason' => Str::limit((string) $event->reason, 300),
                    'created_at' => $event->created_at->toIso8601String(),
                ],
            )->values()->all(),
        ];
    }

    private function modeLabel(IntegrationProviderMode $mode): string
    {
        return $mode === IntegrationProviderMode::Sandbox ? 'Sandbox' : 'Production';
    }

    private function connectionStatusLabel(IntegrationConnectionStatus $status): string
    {
        return match ($status) {
            IntegrationConnectionStatus::Connected => 'Tersambung',
            IntegrationConnectionStatus::Degraded => 'Terganggu',
            IntegrationConnectionStatus::Disconnected => 'Belum tersambung',
        };
    }

    private function sanitizedError(IntegrationSyncEvent $event): ?string
    {
        if ($event->reason === null || $event->reason === '') {
            return null;
        }

        return Str::limit((string) $event->reason, 200);
    }
}
