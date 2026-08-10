<?php

use App\Actions\Integration\DetectSyncAnomalies;
use App\Console\Commands\AlertSyncAnomalies;
use App\Models\IntegrationSyncMetric;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

test('alert command emits alert logs when anomalies exist', function () {
    Log::spy();
    IntegrationSyncMetric::factory()->create(['dead_letter_count' => 1]);

    Artisan::call('integration:alert-sync-anomalies');

    Log::shouldHaveReceived('warning')
        ->withArgs(fn (string $channel) => $channel === 'academic.sync.alert');
});

test('alert command runs without anomalies', function () {
    Artisan::call('integration:alert-sync-anomalies');

    expect(Artisan::output())->toContain('Emitted 0');
});

test('detect action and command are resolved from the container', function () {
    expect(app(DetectSyncAnomalies::class))->toBeInstanceOf(DetectSyncAnomalies::class)
        ->and(app(AlertSyncAnomalies::class))->toBeInstanceOf(AlertSyncAnomalies::class);
});
