<?php

declare(strict_types=1);

use App\Actions\Integration\ReconcileIntegrationSync;
use App\Actions\Integration\RetryIntegrationSync;
use App\Enums\IntegrationSyncStatus;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSync;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;

uses(RefreshDatabase::class);

function integrationOperator(Institution $institution): User
{
    $user = User::factory()->create();
    InstitutionMembership::factory()->campusAdmin()->verifiedByApprovedDomain()->create([
        'institution_id' => $institution->id,
        'user_id' => $user->id,
    ]);

    return $user;
}

it('retry refuses an already-succeeded sync', function () {
    $institution = Institution::factory()->active()->create();
    $operator = integrationOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Succeeded,
    ]);

    expect(fn () => app(RetryIntegrationSync::class)->execute($operator, $sync))
        ->toThrow(InvalidArgumentException::class);
});

it('retry records a queued event and leaves attempts intact', function () {
    Bus::fake();
    $institution = Institution::factory()->active()->create();
    $operator = integrationOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Dead,
        'attempts' => 3,
        'idempotency_key' => 'idemp-retry-actions',
    ]);

    app(RetryIntegrationSync::class)->execute($operator, $sync);

    $fresh = $sync->fresh();
    expect($fresh->status)->toBe(IntegrationSyncStatus::Queued)
        ->and($fresh->attempts)->toBe(3)
        ->and($sync->events()->where('status', IntegrationSyncStatus::Queued->value)->count())->toBe(1);
});

it('reconcile refuses an empty reason', function () {
    $institution = Institution::factory()->active()->create();
    $operator = integrationOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Dead,
    ]);

    expect(fn () => app(ReconcileIntegrationSync::class)->execute($operator, $sync, '  '))
        ->toThrow(InvalidArgumentException::class);
});

it('reconcile refuses an already-reconciled sync', function () {
    $institution = Institution::factory()->active()->create();
    $operator = integrationOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Reconciled,
    ]);

    expect(fn () => app(ReconcileIntegrationSync::class)->execute($operator, $sync, 'Already done.'))
        ->toThrow(InvalidArgumentException::class);
});

it('reconcile records an append-only event and audit trail', function () {
    $institution = Institution::factory()->active()->create();
    $operator = integrationOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Dead,
        'payload_digest' => 'digest-reconcile',
        'idempotency_key' => 'idemp-reconcile',
    ]);

    app(ReconcileIntegrationSync::class)->execute($operator, $sync, 'Data valid di roster.');

    $fresh = $sync->fresh();
    expect($fresh->status)->toBe(IntegrationSyncStatus::Reconciled)
        ->and($sync->events()->where('status', IntegrationSyncStatus::Reconciled->value)->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'academic_sync.reconciled')->exists())->toBeTrue();
});
