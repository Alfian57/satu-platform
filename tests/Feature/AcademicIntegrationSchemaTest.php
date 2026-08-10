<?php

use App\Actions\Integration\ProcessIntegrationSync;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Enums\IntegrationSyncStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSync;
use App\Models\IntegrationSyncEvent;
use App\Models\User;
use App\Support\Integration\SandboxGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Schema and Factory
|--------------------------------------------------------------------------
*/

test('it creates a connection with encrypted config', function () {
    $connection = IntegrationConnection::factory()->create([
        'encrypted_config' => ['token' => 'secret-123'],
    ]);

    expect($connection->encrypted_config)->toBeArray()
        ->and($connection->encrypted_config['token'])->toBe('secret-123');

    // Ensure it's encrypted in the database (raw value is not plaintext)
    $raw = DB::table('integration_connections')->where('id', $connection->id)->value('encrypted_config');
    expect($raw)->not->toContain('secret-123');
});

/*
|--------------------------------------------------------------------------
| Append-Only Enforcement
|--------------------------------------------------------------------------
*/

test('integration sync events cannot be updated', function () {
    $event = IntegrationSyncEvent::factory()->create();

    expect(fn () => $event->save())
        ->toThrow(LogicException::class, 'append-only');
});

test('integration sync events cannot be deleted', function () {
    $event = IntegrationSyncEvent::factory()->create();

    expect(fn () => $event->delete())
        ->toThrow(LogicException::class, 'append-only');
});

/*
|--------------------------------------------------------------------------
| Sandbox Gateway Simulation
|--------------------------------------------------------------------------
*/

test('sandbox gateway simulates success', function () {
    $sync = IntegrationSync::factory()->create();
    $gateway = new SandboxGateway;
    $action = new ProcessIntegrationSync($gateway);

    $action->handle($sync, ['simulate' => 'success']);

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Succeeded)
        ->and($sync->external_reference)->toStartWith('SANDBOX-')
        ->and($sync->events)->toHaveCount(2); // Sending, Succeeded
});

test('sandbox gateway simulates timeout', function () {
    $sync = IntegrationSync::factory()->create();
    $gateway = new SandboxGateway;
    $action = new ProcessIntegrationSync($gateway);

    $action->handle($sync, ['simulate' => 'timeout']);

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Timeout)
        ->and($sync->events->last()->reason)->toContain('timed out');
});

test('sandbox gateway simulates validation error', function () {
    $sync = IntegrationSync::factory()->create();
    $gateway = new SandboxGateway;
    $action = new ProcessIntegrationSync($gateway);

    $action->handle($sync, ['simulate' => 'validation_error']);

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::ValidationError)
        ->and($sync->events->last()->payload_snapshot)->toBeArray();
});

test('sandbox gateway simulates duplicate conflict', function () {
    $sync = IntegrationSync::factory()->create();
    $gateway = new SandboxGateway;
    $action = new ProcessIntegrationSync($gateway);

    $action->handle($sync, ['simulate' => 'duplicate']);

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Conflict);
});

test('sandbox gateway simulates degraded server error', function () {
    $sync = IntegrationSync::factory()->create();
    $gateway = new SandboxGateway;
    $action = new ProcessIntegrationSync($gateway);

    $action->handle($sync, ['simulate' => 'degraded']);

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Failed);
});

test('sync action enforces maximum retry attempts', function () {
    $sync = IntegrationSync::factory()->create(['attempts' => 3]);
    $gateway = new SandboxGateway;
    $action = new ProcessIntegrationSync($gateway);

    $action->handle($sync, ['simulate' => 'success']);

    $sync->refresh();
    expect($sync->status)->toBe(IntegrationSyncStatus::Dead)
        ->and($sync->attempts)->toBe(3); // Does not increment past 3
});

/*
|--------------------------------------------------------------------------
| Cross-Tenant Policies
|--------------------------------------------------------------------------
*/

test('campus admin can view and update their institution connection', function () {
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);
    $user = User::factory()->create();
    InstitutionMembership::factory()->create([
        'institution_id' => $institution->id,
        'user_id' => $user->id,
        'role' => InstitutionMembershipRole::CampusAdmin,
        'status' => InstitutionMembershipStatus::Verified,
    ]);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);

    expect($user->can('view', $connection))->toBeTrue()
        ->and($user->can('update', $connection))->toBeTrue();
});

test('campus admin cannot view other institution connection', function () {
    $institution1 = Institution::factory()->create(['status' => InstitutionStatus::Active]);
    $user = User::factory()->create();
    InstitutionMembership::factory()->create([
        'institution_id' => $institution1->id,
        'user_id' => $user->id,
        'role' => InstitutionMembershipRole::CampusAdmin,
        'status' => InstitutionMembershipStatus::Verified,
    ]);

    $institution2 = Institution::factory()->create(['status' => InstitutionStatus::Active]);
    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution2->id]);

    expect($user->can('view', $connection))->toBeFalse();
});

test('student cannot view integration connection', function () {
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);
    $user = User::factory()->create();
    InstitutionMembership::factory()->create([
        'institution_id' => $institution->id,
        'user_id' => $user->id,
        'role' => InstitutionMembershipRole::Student, // explicit student
        'status' => InstitutionMembershipStatus::Verified,
    ]);

    $connection = IntegrationConnection::factory()->create(['institution_id' => $institution->id]);

    expect($user->can('view', $connection))->toBeFalse();
});
