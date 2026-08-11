<?php

use App\Enums\InstitutionRosterStatus;
use App\Enums\InstitutionStatus;
use App\Models\AffiliationRequest;
use App\Models\Institution;
use App\Models\InstitutionDomain;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\PhoneNumber;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
});

test('onboarding requires authentication', function () {
    $this->get(route('onboarding.show'))
        ->assertRedirect(route('login'));
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
                    'username' => $user->username,
                ])
                ->where('institutions', [
                    ['id' => $first->id, 'name' => 'Akademi Alfa'],
                    ['id' => $second->id, 'name' => 'Universitas Zeta'],
                ])
                ->where('membership', null)
                ->where('affiliation', null)
                ->where('phone', null)
                ->where('canRequest', true)
                ->where('canRetry', false)
                ->where('membershipOutcome', null)
                ->where('affiliationOutcome', null)
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
        ->create(['requested_at' => now()->subDays(2)]);
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
                ->where('canRequest', false)
                ->where('canRetry', false),
        );
});

test('a pending membership from a newer request can be overridden by a verified membership', function () {
    $user = User::factory()->create();
    $pendingInstitution = Institution::factory()->active()->create();
    $verifiedInstitution = Institution::factory()->active()->create();

    InstitutionMembership::factory()
        ->pending()
        ->for($user)
        ->for($pendingInstitution)
        ->create(['requested_at' => now()]);
    InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($verifiedInstitution)
        ->create(['requested_at' => now()->subDays(2)]);

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('membership.institutionId', $verifiedInstitution->id)
                ->where('membership.status', 'verified')
                ->where('canRequest', false)
                ->where('canRetry', false),
        );
});

test('onboarding projects the most recent pending membership when no verified exists', function () {
    $user = User::factory()->create();
    $olderInstitution = Institution::factory()->active()->create();
    $newerInstitution = Institution::factory()->active()->create();

    InstitutionMembership::factory()
        ->pending()
        ->for($user)
        ->for($olderInstitution)
        ->create(['requested_at' => now()->subDays(2)]);
    InstitutionMembership::factory()
        ->pending()
        ->for($user)
        ->for($newerInstitution)
        ->create(['requested_at' => now()]);

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('membership.institutionId', $newerInstitution->id)
                ->where('membership.status', 'pending'),
        );
});

test('an inactive verified membership is not the onboarding authority', function () {
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

test('onboarding exposes only the allowlisted recovery states', function () {
    $user = User::factory()->create();

    foreach (['session_expired', 'forbidden', 'phone_required'] as $recoveryState) {
        $this->withSession(['onboarding_recovery' => $recoveryState])
            ->actingAs($user)
            ->get(route('onboarding.show'))
            ->assertSuccessful()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->where('submissionIssue', $recoveryState),
            );
    }

    $this->withSession(['onboarding_recovery' => '<script>unsafe</script>'])
        ->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('submissionIssue', null),
        );
});

test('onboarding projects only the masked verified phone', function () {
    $user = User::factory()->create();
    $phone = PhoneNumber::factory()
        ->for($user)
        ->forNumber('+6281234567812')
        ->create();

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('phone', [
                    'masked' => $phone->masked,
                    'verified' => true,
                ])
                ->missing('phone.number')
                ->missing('phone.numberHash'),
        );
});

test('stale affiliation exposes safe recovery without roster or match details', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $membership = InstitutionMembership::factory()
        ->pending()
        ->for($user)
        ->for($institution)
        ->create();
    $oldRoster = InstitutionRoster::factory()->for($institution)->create([
        'status' => InstitutionRosterStatus::Superseded,
        'activated_at' => now()->subDay(),
        'superseded_at' => now(),
    ]);
    InstitutionRoster::factory()->for($institution)->create();
    AffiliationRequest::factory()
        ->for($institution)
        ->for($user, 'user')
        ->create([
            'institution_membership_id' => $membership->getKey(),
            'roster_id' => $oldRoster->getKey(),
        ]);

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('affiliation.status', 'pending_review')
                ->where('affiliation.needsRefresh', true)
                ->where('canRequest', true)
                ->where('canRetry', true)
                ->missing('affiliation.matchResult')
                ->missing('affiliation.roster')
                ->missing('affiliation.rosterRow')
                ->missing('affiliation.nim'),
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
