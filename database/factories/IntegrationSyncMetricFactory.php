<?php

namespace Database\Factories;

use App\Models\IntegrationConnection;
use App\Models\IntegrationSyncMetric;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IntegrationSyncMetric>
 */
class IntegrationSyncMetricFactory extends Factory
{
    public function definition(): array
    {
        $connection = IntegrationConnection::factory()->create();

        return [
            'integration_connection_id' => $connection->id,
            'institution_id' => $connection->institution_id,
            'total_syncs' => 0,
            'succeeded_count' => 0,
            'reconciled_count' => 0,
            'dead_letter_count' => 0,
            'total_retries' => 0,
            'queue_age_seconds' => 0,
        ];
    }
}
