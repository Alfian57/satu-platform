<?php

declare(strict_types=1);

namespace App\Actions\Integration;

use App\Actions\Audit\AuditRecorder;
use App\Enums\IntegrationConnectionStatus;
use App\Enums\IntegrationProviderMode;
use App\Models\Institution;
use App\Models\IntegrationConnection;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;

final class CreateIntegrationConnection
{
    public function __construct(
        private readonly AuditRecorder $auditRecorder,
    ) {}

    /**
     * @param  array<string, mixed>|null  $encryptedConfig
     */
    public function execute(
        User $operator,
        Institution $institution,
        string $providerKey,
        IntegrationProviderMode $mode = IntegrationProviderMode::Sandbox,
        ?array $encryptedConfig = null,
    ): IntegrationConnection {
        Gate::forUser($operator)->authorize('create', [IntegrationConnection::class, $institution]);

        $providerKey = trim($providerKey);
        if ($providerKey === '') {
            throw new InvalidArgumentException('Kunci penyedia wajib diisi.');
        }

        $exists = IntegrationConnection::query()
            ->where('institution_id', $institution->getKey())
            ->where('provider_key', $providerKey)
            ->exists();

        if ($exists) {
            throw new InvalidArgumentException("Koneksi dengan penyedia '{$providerKey}' sudah ada untuk institusi ini.");
        }

        return DB::transaction(function () use ($operator, $institution, $providerKey, $mode, $encryptedConfig) {
            $connection = new IntegrationConnection;
            $connection->forceFill([
                'institution_id' => $institution->getKey(),
                'provider_key' => $providerKey,
                'mode' => $mode->value,
                'status' => IntegrationConnectionStatus::Disconnected->value,
                'encrypted_config' => $encryptedConfig,
            ])->save();

            $this->auditRecorder->record(
                operation: 'integration_connection.created',
                auditable: $connection,
                actor: $operator,
                institution: $institution,
                before: [],
                after: [

                    'provider_key' => $providerKey,
                    'mode' => $mode->value,
                    'status' => IntegrationConnectionStatus::Disconnected->value,
                ],
                reason: 'Operator created integration connection.',
                request: request(),
            );

            return $connection->fresh();
        });
    }
}
