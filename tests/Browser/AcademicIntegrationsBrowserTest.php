<?php

use App\Enums\IntegrationSyncStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSync;
use App\Models\User;

function createCampusOperator(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas SATU',
    ]);
    $user = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->create([
            'institution_id' => $institution->id,
            'user_id' => $user->id,
        ]);
    test()->actingAs($user);

    return [$user, $institution];
}

test('campus operator can inspect the sync ledger', function () {
    [$user, $institution] = createCampusOperator();

    $connection = IntegrationConnection::factory()->create([
        'institution_id' => $institution->id,
    ]);
    IntegrationSync::factory()->create([
        'integration_connection_id' => $connection->id,
        'source' => 'roster-2026.csv',
        'status' => IntegrationSyncStatus::Dead,
        'error' => 'status pengiriman tidak sinkron',
    ]);

    visit(route('campus.integrations.index'))
        ->assertPresent('@sync-ledger')
        ->assertSee('roster-2026.csv')
        ->assertSee('dead')
        ->assertSee('Ulangi')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('campus operator sees the empty state when there are no syncs', function () {
    [$user, $institution] = createCampusOperator();

    visit(route('campus.integrations.index'))
        ->assertPresent('@sync-empty')
        ->assertSee('Belum ada riwayat sync')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('student sees the forbidden state for integrations', function () {
    $user = User::factory()->create();
    test()->actingAs($user);

    visit(route('campus.integrations.index'))
        ->assertPresent('@integrations-forbidden')
        ->assertSee('Anda belum memiliki akses integrasi akademik')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
