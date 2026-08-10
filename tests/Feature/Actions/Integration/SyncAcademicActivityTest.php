<?php

use App\Actions\Integration\DispatchAcademicSync;
use App\Enums\IntegrationSyncStatus;
use App\Exceptions\SyncRetryableException;
use App\Jobs\SyncAcademicActivity;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncEvent;
use App\Support\Integration\SandboxGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Dispatch Academic Sync (idempotency + envelope)
|--------------------------------------------------------------------------
*/

test('dispatch creates a sync candidate with mapping version and idempotency key', function () {
    Bus::fake();

    $connection = IntegrationConnection::factory()->create();
    $action = app(DispatchAcademicSync::class);

    $sync = $action->execute(
        connection: $connection,
        source: 'contribution',
        mappingVersion: 'v2',
        idempotencyKey: 'credit-abc-1',
        payload: ['activity_type' => 'project', 'credit' => 3],
    );

    expect($sync)->toBeInstanceOf(IntegrationSync::class)
        ->and($sync->source)->toBe('contribution')
        ->and($sync->mapping_version)->toBe('v2')
        ->and($sync->idempotency_key)->toBe('credit-abc-1')
        ->and($sync->payload_digest)->not->toBeNull();

    Bus::assertDispatched(SyncAcademicActivity::class, function (SyncAcademicActivity $job) use ($sync) {
        return $job->syncId === $sync->id;
    });
});

test('dispatch returns existing succeeded sync without re-dispatching', function () {
    Bus::fake();

    $connection = IntegrationConnection::factory()->create();
    $action = app(DispatchAcademicSync::class);

    $first = $action->execute(
        connection: $connection,
        source: 'contribution',
        mappingVersion: 'v2',
        idempotencyKey: 'credit-abc-1',
        payload: ['activity_type' => 'project', 'credit' => 3],
    );

    $first->forceFill(['status' => IntegrationSyncStatus::Succeeded->value])->save();

    $again = $action->execute(
        connection: $connection,
        source: 'contribution',
        mappingVersion: 'v2',
        idempotencyKey: 'credit-abc-1',
        payload: ['activity_type' => 'project', 'credit' => 3],
    );

    expect($again->id)->toBe($first->id)
        ->and(IntegrationSync::query()->count())->toBe(1);

    Bus::assertDispatchedTimes(SyncAcademicActivity::class, 1);
});

test('envelope payload carries mapping version and idempotency key', function () {
    Bus::fake();

    $connection = IntegrationConnection::factory()->create();
    $action = app(DispatchAcademicSync::class);

    $sync = $action->execute(
        connection: $connection,
        source: 'contribution',
        mappingVersion: 'v2',
        idempotencyKey: 'credit-abc-1',
        payload: ['activity_type' => 'project'],
    );

    Bus::assertDispatched(SyncAcademicActivity::class, function (SyncAcademicActivity $job) {
        return $job->payload === [
            'activity_type' => 'project',
            'mapping_version' => 'v2',
            'idempotency_key' => 'credit-abc-1',
        ];
    });
});

/*
|--------------------------------------------------------------------------
| Sync Job
|--------------------------------------------------------------------------
*/

test('job succeeds and records external reference', function () {
    $connection = IntegrationConnection::factory()->create();
    $sync = IntegrationSync::factory()->create(['integration_connection_id' => $connection->id]);

    $job = new SyncAcademicActivity($sync->id, ['simulate' => 'success']);
    $job->handle(new SandboxGateway);

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Succeeded)
        ->and($sync->external_reference)->toStartWith('SANDBOX-');
});

test('job reconciles on duplicate without creating a new external credit', function () {
    $connection = IntegrationConnection::factory()->create();
    $sync = IntegrationSync::factory()->create(['integration_connection_id' => $connection->id]);

    $job = new SyncAcademicActivity($sync->id, ['simulate' => 'duplicate']);
    $job->handle(new SandboxGateway);

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Reconciled)
        ->and($sync->events()->where('status', IntegrationSyncStatus::Succeeded->value)->count())->toBe(0);
});

test('job rethrows retryable errors for backoff', function () {
    $connection = IntegrationConnection::factory()->create();
    $sync = IntegrationSync::factory()->create(['integration_connection_id' => $connection->id]);

    $job = new SyncAcademicActivity($sync->id, ['simulate' => 'timeout']);

    expect(fn () => $job->handle(new SandboxGateway))
        ->toThrow(SyncRetryableException::class);

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Timeout);
});

test('job marks permanent failures as dead on failed hook', function () {
    $connection = IntegrationConnection::factory()->create();
    $sync = IntegrationSync::factory()->create(['integration_connection_id' => $connection->id]);

    $job = new SyncAcademicActivity($sync->id, ['simulate' => 'validation_error']);
    $job->handle(new SandboxGateway);

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::ValidationError);
});

test('job skips already-terminal syncs to preserve idempotency', function () {
    $connection = IntegrationConnection::factory()->create();
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Succeeded,
    ]);

    $job = new SyncAcademicActivity($sync->id, ['simulate' => 'timeout']);
    $job->handle(new SandboxGateway);

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Succeeded)
        ->and($sync->attempts)->toBe(0);
});

test('failed hook marks sync dead with append-only history', function () {
    $connection = IntegrationConnection::factory()->create();
    $sync = IntegrationSync::factory()->create(['integration_connection_id' => $connection->id]);

    $job = new SyncAcademicActivity($sync->id, ['simulate' => 'degraded']);
    $job->failed(new RuntimeException('Provider unreachable after retries'));

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Dead)
        ->and($sync->events()->where('status', IntegrationSyncStatus::Dead->value)->count())->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Cross-Tenant Job Boundary
|--------------------------------------------------------------------------
*/

test('job processes only syncs bound to the scoped connection', function () {
    $connectionA = IntegrationConnection::factory()->create();
    $connectionB = IntegrationConnection::factory()->create();

    $syncA = IntegrationSync::factory()->create(['integration_connection_id' => $connectionA->id]);
    $syncB = IntegrationSync::factory()->create(['integration_connection_id' => $connectionB->id]);

    $job = new SyncAcademicActivity($syncA->id, ['simulate' => 'success']);
    $job->handle(new SandboxGateway);

    $syncA->refresh();
    $syncB->refresh();

    expect($syncA->status)->toBe(IntegrationSyncStatus::Succeeded)
        ->and($syncB->status)->toBe(IntegrationSyncStatus::Queued);
});

test('sync events remain append-only after job retries', function () {
    $connection = IntegrationConnection::factory()->create();
    $sync = IntegrationSync::factory()->create(['integration_connection_id' => $connection->id]);

    $job = new SyncAcademicActivity($sync->id, ['simulate' => 'timeout']);

    try {
        $job->handle(new SandboxGateway);
    } catch (SyncRetryableException) {
        // expected retry path
    }

    $latest = IntegrationSyncEvent::query()
        ->where('integration_sync_id', $sync->id)
        ->latest('id')
        ->first();

    expect(fn () => $latest->save())->toThrow(LogicException::class, 'append-only');
});
