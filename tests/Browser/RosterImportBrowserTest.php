<?php

use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;

test('campus operator can open the roster workspace from the sidebar', function () {
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Roster SATU',
    ]);
    $operator = User::factory()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($operator)
        ->for($institution)
        ->create();
    $this->actingAs($operator);

    visit(route('dashboard'))
        ->waitForText('Ringkasan Operasional Kampus')
        ->click('Roster mahasiswa')
        ->waitForText('Impor roster baru')
        ->assertSee('Roster mahasiswa')
        ->assertSee('Universitas Roster SATU')
        ->resize(390, 844)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
