<?php

use App\Actions\Integration\RecordIntegrationSyncMetric;
use App\Enums\IntegrationSyncStatus;
use App\Jobs\SyncAcademicActivity;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncMetric;
use App\Support\Integration\SandboxGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Aggregate Metric Recording
|--------------------------------------------------------------------------
*/

test('successful sync records a succeeded metric row scoped to connection and institution', function () {
    $connection = IntegrationConnection::factory()->create();

    $job = new SyncAcademicActivity(
        IntegrationSync::factory()->create(['integration_connection_id' => $connection->id])->id,
        ['simulate' => 'success'],
    );
    $job->handle(new SandboxGateway);

    $metric = IntegrationSyncMetric::query()->where('integration_connection_id', $connection->id)->first();

    expect($metric)->not->toBeNull()
        ->and($metric->institution_id)->toBe($connection->institution_id)
        ->and($metric->total_syncs)->toBe(1)
        ->and($metric->succeeded_count)->toBe(1)
        ->and($metric->reconciled_count)->toBe(0)
        ->and($metric->dead_letter_count)->toBe(0)
        ->and($metric->last_sync_at)->not->toBeNull();
});

test('duplicate sync records a reconciled metric row', function () {
    $connection = IntegrationConnection::factory()->create();

    $job = new SyncAcademicActivity(
        IntegrationSync::factory()->create(['integration_connection_id' => $connection->id])->id,
        ['simulate' => 'duplicate'],
    );
    $job->handle(new SandboxGateway);

    $metric = IntegrationSyncMetric::query()->where('integration_connection_id', $connection->id)->first();

    expect($metric)->not->toBeNull()
        ->and($metric->succeeded_count)->toBe(0)
        ->and($metric->reconciled_count)->toBe(1);
});

test('dead-letter sync records a dead letter metric row with retries', function () {
    $connection = IntegrationConnection::factory()->create();
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'attempts' => 4,
    ]);

    $job = new SyncAcademicActivity($sync->id, ['simulate' => 'degraded']);
    $job->failed(new RuntimeException('Provider unreachable after retries'));

    $metric = IntegrationSyncMetric::query()->where('integration_connection_id', $connection->id)->first();

    expect($metric)->not->toBeNull()
        ->and($metric->dead_letter_count)->toBe(1)
        ->and($metric->total_retries)->toBe(3);
});

test('metrics rows remain isolated between connections', function () {
    $connectionA = IntegrationConnection::factory()->create();
    $connectionB = IntegrationConnection::factory()->create();

    $jobA = new SyncAcademicActivity(
        IntegrationSync::factory()->create(['integration_connection_id' => $connectionA->id])->id,
        ['simulate' => 'success'],
    );
    $jobA->handle(new SandboxGateway);

    expect(IntegrationSyncMetric::query()->where('integration_connection_id', $connectionB->id)->count())->toBe(0);
});

test('metric action records once per sync lifecycle', function () {
    $connection = IntegrationConnection::factory()->create();
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Succeeded,
        'attempts' => 1,
    ]);

    (new RecordIntegrationSyncMetric)->record($sync);
    (new RecordIntegrationSyncMetric)->record($sync);

    $metric = IntegrationSyncMetric::query()->where('integration_connection_id', $connection->id)->first();

    expect($metric->total_syncs)->toBe(2);
});
