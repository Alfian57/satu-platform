<?php

namespace Database\Factories;

use App\Enums\IntegrationSyncStatus;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IntegrationSyncEvent>
 */
class IntegrationSyncEventFactory extends Factory
{
    public function definition(): array
    {
        return [
            'integration_sync_id' => IntegrationSync::factory(),
            'status' => IntegrationSyncStatus::Queued,
            'reason' => 'Sync queued',
        ];
    }
}
