<?php

namespace Database\Factories;

use App\Enums\IntegrationConnectionStatus;
use App\Enums\IntegrationProviderMode;
use App\Models\Institution;
use App\Models\IntegrationConnection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IntegrationConnection>
 */
class IntegrationConnectionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory(),
            'provider_key' => 'dummy-provider-'.uniqid(),
            'mode' => IntegrationProviderMode::Sandbox,
            'encrypted_config' => ['token' => 'sandbox-secret'],
            'status' => IntegrationConnectionStatus::Connected,
        ];
    }
}
