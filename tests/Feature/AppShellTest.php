<?php

use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
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
                    ->where('auth.user.is_platform_admin', false)
                    ->where('auth.user.workspace', [
                        'role' => 'student',
                        'institution' => null,
                        'recruiterOrganization' => null,
                    ])
                    ->where('shell.institutionMembership', null),
            );
    }
});

test('platform admins enter the platform workspace with their role context', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);

    $this->actingAs($platformAdmin)
        ->get(route('dashboard'))
        ->assertRedirect(route('platform.affiliations.index'));

    $this->get(route('platform.affiliations.index'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('platform/affiliations')
                ->where('auth.user.id', $platformAdmin->id)
                ->where('auth.user.is_platform_admin', true)
                ->where('auth.user.workspace', [
                    'role' => 'platform_admin',
                    'institution' => null,
                    'recruiterOrganization' => null,
                ]),
        );
});

test('campus admins enter their active institution workspace from the dashboard', function () {
    $campusAdmin = User::factory()->create();
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Operator SATU',
    ]);
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($campusAdmin)
        ->for($institution)
        ->create();

    $this->actingAs($campusAdmin)
        ->get(route('dashboard'))
        ->assertRedirect(route('campus.overview.show', $institution));

    $this->withoutVite()
        ->get(route('campus.overview.show', $institution))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('campus/overview')
                ->where('auth.user.workspace', [
                    'role' => 'campus_admin',
                    'institution' => [
                        'id' => $institution->id,
                        'name' => 'Universitas Operator SATU',
                    ],
                    'recruiterOrganization' => null,
                ]),
        );
});

test('campus routes keep the shell scoped to the institution in the URL', function () {
    $campusAdmin = User::factory()->create();
    $firstInstitution = Institution::factory()->active()->create([
        'name' => 'Universitas Pertama',
    ]);
    $selectedInstitution = Institution::factory()->active()->create([
        'name' => 'Universitas Dipilih',
    ]);

    foreach ([$firstInstitution, $selectedInstitution] as $institution) {
        InstitutionMembership::factory()
            ->campusAdmin()
            ->verifiedByApprovedDomain()
            ->for($campusAdmin)
            ->for($institution)
            ->create();
    }

    $this->withoutVite()
        ->actingAs($campusAdmin)
        ->get(route('campus.overview.show', $firstInstitution))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.workspace.institution', [
                'id' => $firstInstitution->id,
                'name' => 'Universitas Pertama',
            ])
        );
});

test('recruiters enter their verified organization workspace from the dashboard', function () {
    $recruiter = User::factory()->create();
    $organization = RecruiterOrganization::factory()->verified()->create([
        'name' => 'Mitra Talenta SATU',
    ]);
    RecruiterMembership::factory()
        ->for($recruiter)
        ->for($organization, 'organization')
        ->create();

    $this->actingAs($recruiter)
        ->get(route('dashboard'))
        ->assertRedirect(route('recruiter.talent.search'));

    $this->get(route('recruiter.talent.search'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('talent/search')
                ->where('auth.user.workspace', [
                    'role' => 'recruiter',
                    'institution' => null,
                    'recruiterOrganization' => [
                        'id' => $organization->id,
                        'name' => 'Mitra Talenta SATU',
                    ],
                ]),
        );
});

test('recruiter routes select the recruiter workspace for a dual-role user', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $organization = RecruiterOrganization::factory()->verified()->create([
        'name' => 'Organisasi Dual Role SATU',
    ]);

    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();
    RecruiterMembership::factory()
        ->for($user)
        ->for($organization, 'organization')
        ->create();

    $this->actingAs($user)
        ->get(route('recruiter.talent.search'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.workspace', [
                'role' => 'recruiter',
                'institution' => null,
                'recruiterOrganization' => [
                    'id' => $organization->id,
                    'name' => 'Organisasi Dual Role SATU',
                ],
            ])
        );
});

test('inactive privileged memberships cannot select a privileged workspace', function () {
    $campusAdmin = User::factory()->create();
    $inactiveInstitution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($campusAdmin)
        ->for($inactiveInstitution)
        ->create();
    $inactiveInstitution->update(['status' => InstitutionStatus::Suspended]);

    $recruiter = User::factory()->create();
    $suspendedOrganization = RecruiterOrganization::factory()->suspended()->create();
    RecruiterMembership::factory()
        ->for($recruiter)
        ->for($suspendedOrganization, 'organization')
        ->create();

    $this->actingAs($campusAdmin)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.workspace.role', 'student')
        );

    $this->actingAs($recruiter)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.workspace.role', 'student')
        );
});

test('suspended campus and recruiter memberships remain in the student workspace', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->campusAdmin()
        ->suspended()
        ->for($user)
        ->for($institution)
        ->create([
            'status' => InstitutionMembershipStatus::Suspended,
        ]);
    $organization = RecruiterOrganization::factory()->verified()->create();
    RecruiterMembership::factory()
        ->suspended()
        ->for($user)
        ->for($organization, 'organization')
        ->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.workspace.role', 'student')
        );
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
