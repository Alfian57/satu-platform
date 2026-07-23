<?php

use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('authenticated pages receive the SATU shell context', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $pages = [
        'dashboard' => 'dashboard',
        'profile.edit' => 'settings/profile',
        'appearance.edit' => 'settings/appearance',
    ];

    foreach ($pages as $routeName => $component) {
        $this->get(route($routeName))
            ->assertSuccessful()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component($component)
                    ->where('name', 'SATU')
                    ->where('auth.user.id', $user->id)
                    ->where('shell.institutionMembership', null),
            );
    }
});

test('public pages receive a nullable authenticated user and shell context', function () {
    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('welcome')
                ->where('name', 'SATU')
                ->where('auth.user', null)
                ->where('shell.institutionMembership', null),
        );
});

test('authenticated pages receive only the safe current affiliation summary', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas SATU',
    ]);
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('shell.institutionMembership', [
                    'institutionName' => 'Universitas SATU',
                    'status' => 'verified',
                ])
                ->missing('shell.institutionMembership.id')
                ->missing('shell.institutionMembership.institutionId')
                ->missing('shell.institutionMembership.verificationMethod'),
        );
});

test('the shell ignores verified affiliations owned by inactive institutions', function () {
    $user = User::factory()->create();
    $inactiveInstitution = Institution::factory()->active()->create();
    $activeInstitution = Institution::factory()->active()->create([
        'name' => 'Universitas Aktif',
    ]);

    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($inactiveInstitution)
        ->create(['requested_at' => now()]);
    InstitutionMembership::factory()
        ->pending()
        ->for($user)
        ->for($activeInstitution)
        ->create(['requested_at' => now()->subDay()]);
    $inactiveInstitution->update([
        'status' => InstitutionStatus::Suspended,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('shell.institutionMembership', [
                    'institutionName' => 'Universitas Aktif',
                    'status' => 'pending',
                ]),
        );
});
