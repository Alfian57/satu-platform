<?php

use App\Enums\InstitutionStatus;
use App\Models\Institution;
use App\Models\InstitutionDomain;
use App\Models\InstitutionMembership;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('onboarding requires verified authentication', function () {
    $this->get(route('onboarding.show'))
        ->assertRedirect(route('login'));

    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertRedirect(route('verification.notice', absolute: false));
});

test('onboarding exposes active institutions in deterministic order without domain data', function () {
    $user = User::factory()->create();
    $second = Institution::factory()->active()->create(['name' => 'Universitas Zeta']);
    $first = Institution::factory()->active()->create(['name' => 'Akademi Alfa']);
    Institution::factory()->create([
        'name' => 'Kampus Belum Aktif',
        'status' => InstitutionStatus::Pending,
    ]);
    Institution::factory()->suspended()->create(['name' => 'Kampus Ditangguhkan']);
    InstitutionDomain::factory()->verified()->for($first)->create([
        'domain' => 'rahasia-kampus.ac.id',
    ]);

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('onboarding')
                ->where('account', [
                    'email' => $user->email,
                    'emailVerified' => true,
                ])
                ->where('institutions', [
                    ['id' => $first->id, 'name' => 'Akademi Alfa'],
                    ['id' => $second->id, 'name' => 'Universitas Zeta'],
                ])
                ->where('membership', null)
                ->where('canRequest', true)
                ->where('canRetry', false)
                ->where('membershipOutcome', null)
                ->where('submissionIssue', null)
                ->missing('institutions.0.domain')
                ->missing('account.name'),
        );
});

test('onboarding renders an actionable empty institution state', function () {
    $user = User::factory()->create();
    Institution::factory()->create();

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('onboarding')
                ->where('institutions', [])
                ->where('canRequest', true),
        );
});

test(
    'onboarding projects safe membership state for :dataset',
    function (
        string $factoryState,
        string $expectedStatus,
        bool $canRequest,
        bool $canRetry,
    ) {
        $user = User::factory()->create();
        $institution = Institution::factory()->active()->create([
            'name' => 'Universitas Aman',
        ]);
        InstitutionMembership::factory()
            ->{$factoryState}()
            ->for($user)
            ->for($institution)
            ->create();
        InstitutionDomain::factory()->verified()->for($institution)->create([
            'domain' => 'internal.ac.id',
        ]);

        $this->actingAs($user)
            ->get(route('onboarding.show'))
            ->assertSuccessful()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component('onboarding')
                    ->where('membership', [
                        'institutionId' => $institution->id,
                        'institutionName' => 'Universitas Aman',
                        'status' => $expectedStatus,
                    ])
                    ->where('canRequest', $canRequest)
                    ->where('canRetry', $canRetry)
                    ->missing('membership.id')
                    ->missing('membership.userId')
                    ->missing('membership.verificationMethod')
                    ->missing('membership.reviewedBy')
                    ->missing('membership.reviewOutcome')
                    ->missing('membership.reason')
                    ->missing('membership.domain'),
            );
    },
)->with([
    'unverified' => ['unverified', 'unverified', true, false],
    'rejected' => ['rejected', 'unverified', true, true],
    'pending' => ['pending', 'pending', false, false],
    'verified' => ['verifiedByApprovedDomain', 'verified', false, false],
    'suspended' => ['suspended', 'suspended', false, false],
]);

test('a verified membership remains the onboarding authority over a newer pending request', function () {
    $user = User::factory()->create();
    $verifiedInstitution = Institution::factory()->active()->create();
    $pendingInstitution = Institution::factory()->active()->create();

    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($verifiedInstitution)
        ->create(['requested_at' => now()->subDay()]);
    InstitutionMembership::factory()
        ->pending()
        ->for($user)
        ->for($pendingInstitution)
        ->create(['requested_at' => now()]);

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('membership.institutionId', $verifiedInstitution->id)
                ->where('membership.status', 'verified')
                ->where('canRequest', false),
        );
});

test('only memberships at active institutions can become the onboarding authority', function () {
    $user = User::factory()->create();
    $inactiveInstitution = Institution::factory()->active()->create([
        'name' => 'Universitas Lama',
    ]);
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
    $inactiveInstitution->update(['status' => InstitutionStatus::Suspended]);

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('membership', [
                    'institutionId' => $activeInstitution->id,
                    'institutionName' => 'Universitas Aktif',
                    'status' => 'pending',
                ])
                ->where('canRequest', false)
                ->where('canRetry', false),
        );
});

test('an inactive verified membership does not block requesting an active affiliation', function () {
    $user = User::factory()->create();
    $inactiveInstitution = Institution::factory()->active()->create();
    $activeInstitution = Institution::factory()->active()->create([
        'name' => 'Kampus Tersedia',
    ]);

    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($inactiveInstitution)
        ->create();
    $inactiveInstitution->update(['status' => InstitutionStatus::Archived]);

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('membership', null)
                ->where('institutions', [
                    ['id' => $activeInstitution->id, 'name' => 'Kampus Tersedia'],
                ])
                ->where('canRequest', true),
        );
});

test('rejected membership at an inactive institution cannot be retried invisibly', function () {
    $user = User::factory()->create();
    $inactive = Institution::factory()->active()->create();
    $available = Institution::factory()->active()->create([
        'name' => 'Kampus Tersedia',
    ]);
    InstitutionMembership::factory()
        ->rejected()
        ->for($user)
        ->for($inactive)
        ->create();
    $inactive->update(['status' => InstitutionStatus::Suspended]);

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('institutions', [
                    ['id' => $available->id, 'name' => 'Kampus Tersedia'],
                ])
                ->where('membership', null)
                ->where('canRequest', true)
                ->where('canRetry', false),
        );
});

test('onboarding exposes a safe one-time outcome after a membership request', function () {
    $user = User::factory()->create();

    $this->withSession(['membership_status' => 'pending'])
        ->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('membershipOutcome', 'pending'),
        );
});

test('onboarding exposes only the allowlisted expired-session recovery state', function () {
    $user = User::factory()->create();

    $this->withSession(['onboarding_recovery' => 'session_expired'])
        ->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('submissionIssue', 'session_expired'),
        );

    $this->withSession(['onboarding_recovery' => '<script>unsafe</script>'])
        ->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('submissionIssue', null),
        );
});

test('onboarding never projects another students affiliation', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($otherUser)
        ->for($institution)
        ->create();

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('membership', null)
                ->where('canRequest', true)
                ->missing('membership.userId'),
        );
});
