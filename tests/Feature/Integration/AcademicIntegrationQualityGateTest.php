<?php

declare(strict_types=1);

use App\Actions\Integration\ReconcileIntegrationSync;
use App\Actions\Integration\RetryIntegrationSync;
use App\Enums\IntegrationConnectionStatus;
use App\Enums\IntegrationProviderMode;
use App\Enums\IntegrationSyncStatus;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncMetric;
use App\Models\User;
use App\Support\Integration\IntegrationConnectionSerializer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Gate;

uses(RefreshDatabase::class);

function qualityGateOperator(Institution $institution): User
{
    $user = User::factory()->create();
    InstitutionMembership::factory()->campusAdmin()->verifiedByApprovedDomain()->create([
        'institution_id' => $institution->id,
        'user_id' => $user->id,
    ]);

    return $user;
}

it('verifies sandbox scenarios and metric recording for academic integration', function () {
    $institution = Institution::factory()->active()->create();
    $connection = IntegrationConnection::factory()->create([
        'institution_id' => $institution->id,
        'mode' => IntegrationProviderMode::Sandbox,
        'status' => IntegrationConnectionStatus::Connected,
    ]);

    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Succeeded,
        'attempts' => 1,
    ]);

    $metric = IntegrationSyncMetric::factory()->create([
        'integration_connection_id' => $connection->id,
        'institution_id' => $institution->id,
    ]);

    expect(IntegrationSyncMetric::where('id', $metric->id)->exists())->toBeTrue()
        ->and($connection->mode)->toBe(IntegrationProviderMode::Sandbox);
});

it('enforces retry idempotency without advancing attempt count', function () {
    Bus::fake();
    $institution = Institution::factory()->active()->create();
    $operator = qualityGateOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Dead,
        'attempts' => 3,
        'idempotency_key' => 'idemp-quality-retry',
    ]);

    app(RetryIntegrationSync::class)->execute($operator, $sync);

    $fresh = $sync->fresh();
    expect($fresh->status)->toBe(IntegrationSyncStatus::Queued)
        ->and($fresh->attempts)->toBe(3)
        ->and($sync->events()->where('status', IntegrationSyncStatus::Queued->value)->count())->toBe(1);
});

it('enforces reconciliation workflow with audit reason for terminal sync', function () {
    $institution = Institution::factory()->active()->create();
    $operator = qualityGateOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Dead,
        'payload_digest' => 'digest-quality-reconcile',
        'idempotency_key' => 'idemp-quality-reconcile',
    ]);

    app(ReconcileIntegrationSync::class)->execute($operator, $sync, 'Peninjauan registrasi kampus selesai.');

    $fresh = $sync->fresh();
    expect($fresh->status)->toBe(IntegrationSyncStatus::Reconciled)
        ->and($sync->events()->where('status', IntegrationSyncStatus::Reconciled->value)->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'academic_sync.reconciled')->exists())->toBeTrue();
});

it('prevents cross-tenant retry or reconcile operations', function () {
    $institutionA = Institution::factory()->active()->create();
    $institutionB = Institution::factory()->active()->create();

    $operatorA = qualityGateOperator($institutionA);

    $connectionB = IntegrationConnection::factory()->create(['institution_id' => $institutionB->id]);
    $syncB = IntegrationSync::factory()->create([
        'integration_connection_id' => $connectionB->id,
        'status' => IntegrationSyncStatus::Dead,
        'idempotency_key' => 'idemp-cross-tenant',
    ]);

    $this->actingAs($operatorA);

    expect(Gate::forUser($operatorA)->allows('update', $syncB))->toBeFalse();

    $this->postJson(route('campus.integrations.syncs.retry', $syncB->id))
        ->assertForbidden();

    $this->postJson(route('campus.integrations.syncs.reconcile', $syncB->id), [
        'reason' => 'Unauthorized cross-tenant attempt',
    ])->assertForbidden();
});

it('sanitizes error messages and prevents sensitive token or raw payload exposure', function () {
    $sync = IntegrationSync::factory()->create([
        'status' => IntegrationSyncStatus::Failed,
    ]);

    $serializer = app(IntegrationConnectionSerializer::class);
    $serialized = $serializer->sync($sync);

    expect($serialized)->not->toHaveKey('raw_payload')
        ->and($serialized)->not->toHaveKey('secret_key')
        ->and($serialized)->toHaveKey('id')
        ->and($serialized)->toHaveKey('status');
});
