<?php

declare(strict_types=1);

use App\Enums\IntegrationConnectionStatus;
use App\Enums\IntegrationProviderMode;
use App\Enums\IntegrationSyncStatus;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function makeOperator(Institution $institution): User
{
    $user = User::factory()->create();
    InstitutionMembership::factory()->campusAdmin()->verifiedByApprovedDomain()->create([
        'institution_id' => $institution->id,
        'user_id' => $user->id,
    ]);

    return $user;
}

it('renders the integrations page for a campus operator with connections and syncs', function () {
    $institution = Institution::factory()->active()->create();
    $operator = makeOperator($institution);

    $connection = IntegrationConnection::factory()->create([
        'institution_id' => $institution->id,
        'mode' => IntegrationProviderMode::Sandbox,
        'status' => IntegrationConnectionStatus::Connected,
    ]);

    IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'source' => 'contribution',
        'mapping_version' => 'v2',
        'status' => IntegrationSyncStatus::Succeeded,
    ]);

    $this->actingAs($operator)
        ->get(route('campus.integrations.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('campus/integrations')
            ->where('forbidden', false)
            ->has('connections', 1)
            ->where('connections.0.mode', 'sandbox')
            ->where('syncs.data.0.source', 'contribution')
            ->where('syncs.data.0.status', 'succeeded')
            ->where('syncs.data.0.error', null)
        );
});

it('renders forbidden state when the user is not a campus operator', function () {
    $institution = Institution::factory()->active()->create();
    $student = User::factory()->create();
    InstitutionMembership::factory()->student()->verifiedByApprovedDomain()->create([
        'institution_id' => $institution->id,
        'user_id' => $student->id,
    ]);

    IntegrationConnection::factory()->create(['institution_id' => $institution->id]);

    $this->actingAs($student)
        ->get(route('campus.integrations.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('campus/integrations')
            ->where('forbidden', true)
            ->where('connections', [])
        );
});

it('does not expose syncs from another institution', function () {
    $institutionA = Institution::factory()->active()->create();
    $institutionB = Institution::factory()->active()->create();

    $operator = makeOperator($institutionA);

    $connectionA = IntegrationConnection::factory()->create(['institution_id' => $institutionA->id]);
    IntegrationSync::factory()->create([
        'integration_connection_id' => $connectionA->id,
        'source' => 'mine',
        'status' => IntegrationSyncStatus::Succeeded,
    ]);

    $connectionB = IntegrationConnection::factory()->create(['institution_id' => $institutionB->id]);
    IntegrationSync::factory()->create([
        'integration_connection_id' => $connectionB->id,
        'source' => 'other-tenant',
        'status' => IntegrationSyncStatus::Succeeded,
    ]);

    $this->actingAs($operator)
        ->get(route('campus.integrations.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('syncs.data', 1)
            ->where('syncs.data.0.source', 'mine')
        );
});

it('filters syncs by status via query string', function () {
    $institution = Institution::factory()->active()->create();
    $operator = makeOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'source' => 'ok',
        'status' => IntegrationSyncStatus::Succeeded,
    ]);
    IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'source' => 'dead',
        'status' => IntegrationSyncStatus::Dead,
    ]);

    $this->actingAs($operator)
        ->get(route('campus.integrations.index', ['status' => 'dead']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.status', 'dead')
            ->has('syncs.data', 1)
            ->where('syncs.data.0.source', 'dead')
        );
});

it('exposes a sanitized error and timeline but never a raw payload', function () {
    $institution = Institution::factory()->active()->create();
    $operator = makeOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Dead,
    ]);

    IntegrationSyncEvent::factory()->create([
        'integration_sync_id' => $sync->id,
        'status' => IntegrationSyncStatus::Dead,
        'reason' => 'Provider rejected the request.',
    ]);

    $this->actingAs($operator)
        ->get(route('campus.integrations.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('syncs.data.0.error', 'Provider rejected the request.')
            ->has('syncs.data.0.timeline', 1)
            ->where('syncs.data.0.timeline.0.status', 'dead')
            ->where('syncs.data.0.timeline.0.reason', 'Provider rejected the request.')
        );
});

it('lets a campus operator retry a dead sync', function () {
    $institution = Institution::factory()->active()->create();
    $operator = makeOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Dead,
        'idempotency_key' => 'idemp-retry',
    ]);

    $this->actingAs($operator)
        ->post(route('campus.integrations.syncs.retry', ['id' => $sync->id]))
        ->assertRedirect();

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Queued)
        ->and($sync->events()->where('status', IntegrationSyncStatus::Queued->value)->count())->toBe(1);
});

it('blocks a student from retrying a sync', function () {
    $institution = Institution::factory()->active()->create();
    $student = User::factory()->create();
    InstitutionMembership::factory()->student()->verifiedByApprovedDomain()->create([
        'institution_id' => $institution->id,
        'user_id' => $student->id,
    ]);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Dead,
    ]);

    $this->actingAs($student)
        ->post(route('campus.integrations.syncs.retry', ['id' => $sync->id]))
        ->assertForbidden();
});

it('lets a campus operator reconcile a dead sync with a reason', function () {
    $institution = Institution::factory()->active()->create();
    $operator = makeOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Dead,
    ]);

    $this->actingAs($operator)
        ->post(route('campus.integrations.syncs.reconcile', ['id' => $sync->id]), [
            'reason' => 'Data sudah dicek manual di provider.',
        ])
        ->assertRedirect();

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Reconciled)
        ->and($sync->events()->where('status', IntegrationSyncStatus::Reconciled->value)->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'academic_sync.reconciled')->exists())->toBeTrue();
});

it('requires a reason to reconcile', function () {
    $institution = Institution::factory()->active()->create();
    $operator = makeOperator($institution);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'status' => IntegrationSyncStatus::Dead,
    ]);

    $this->actingAs($operator)
        ->from(route('campus.integrations.index'))
        ->post(route('campus.integrations.syncs.reconcile', ['id' => $sync->id]), [])
        ->assertSessionHasErrors('reason');

    expect($sync->fresh()->status)->toBe(IntegrationSyncStatus::Dead);
});

it('blocks cross-tenant retry via policy', function () {
    $institutionA = Institution::factory()->active()->create();
    $institutionB = Institution::factory()->active()->create();

    $operator = makeOperator($institutionA);
    $connectionB = IntegrationConnection::factory()->create(['institution_id' => $institutionB->id]);
    $sync = IntegrationSync::factory()->create([
        'integration_connection_id' => $connectionB->id,
        'status' => IntegrationSyncStatus::Dead,
    ]);

    $this->actingAs($operator)
        ->post(route('campus.integrations.syncs.retry', ['id' => $sync->id]))
        ->assertForbidden();
});
