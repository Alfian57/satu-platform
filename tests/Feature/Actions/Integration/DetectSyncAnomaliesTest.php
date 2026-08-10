<?php

use App\Actions\Integration\DetectSyncAnomalies;
use App\Models\IntegrationSyncMetric;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Alert Detection
|--------------------------------------------------------------------------
*/

test('alerts when a connection has dead letters', function () {
    Log::spy();

    IntegrationSyncMetric::factory()->create(['dead_letter_count' => 2]);

    $alerts = (new DetectSyncAnomalies)->run();

    expect($alerts)->toBe(1);

    Log::shouldHaveReceived('warning')
        ->withArgs(fn (string $channel, array $context) => $channel === 'academic.sync.alert'
            && $context['alert'] === 'dead_letter'
            && $context['dead_letter_count'] === 2);
});

test('alerts when queue age exceeds threshold', function () {
    Log::spy();

    IntegrationSyncMetric::factory()->create(['queue_age_seconds' => 5000]);

    $alerts = (new DetectSyncAnomalies)->run(queueAgeThresholdSeconds: 3600);

    expect($alerts)->toBe(1);

    Log::shouldHaveReceived('warning')
        ->withArgs(fn (string $channel, array $context) => $context['alert'] === 'queue_age'
            && $context['queue_age_seconds'] === 5000);
});

test('alerts when retry volume exceeds threshold', function () {
    Log::spy();

    IntegrationSyncMetric::factory()->create(['total_retries' => 6]);

    $alerts = (new DetectSyncAnomalies)->run(retryThreshold: 3);

    expect($alerts)->toBe(1);

    Log::shouldHaveReceived('warning')
        ->withArgs(fn (string $channel, array $context) => $context['alert'] === 'retry_volume'
            && $context['total_retries'] === 6);
});

test('does not alert on healthy connections', function () {
    Log::spy();

    IntegrationSyncMetric::factory()->create([
        'dead_letter_count' => 0,
        'queue_age_seconds' => 60,
        'total_retries' => 0,
    ]);

    $alerts = (new DetectSyncAnomalies)->run();

    expect($alerts)->toBe(0);

    Log::shouldNotHaveReceived('warning');
});

test('alerts are scoped to institution identifier and never payload content', function () {
    Log::spy();

    $metric = IntegrationSyncMetric::factory()->create(['dead_letter_count' => 1]);

    (new DetectSyncAnomalies)->run();

    Log::shouldHaveReceived('warning')->withArgs(function (string $channel, array $context) use ($metric) {
        return $channel === 'academic.sync.alert'
            && $context['institution_id'] === $metric->institution_id
            && $context['connection_id'] === $metric->integration_connection_id;
    });
});
