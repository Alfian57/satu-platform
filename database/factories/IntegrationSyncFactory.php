<?php

namespace Database\Factories;

use App\Enums\IntegrationSyncStatus;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSync;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IntegrationSync>
 */
class IntegrationSyncFactory extends Factory
{
    public function definition(): array
    {
        return [
            'integration_connection_id' => IntegrationConnection::factory(),
            'source' => 'test-source',
            'mapping_version' => 'v1',
            'idempotency_key' => 'idemp-'.uniqid(),
            'payload_digest' => 'digest-'.uniqid(),
            'status' => IntegrationSyncStatus::Queued,
            'attempts' => 0,
        ];
    }
}
