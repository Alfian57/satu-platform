<?php

use App\Actions\InstitutionMemberships\RequestInstitutionMembership;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Enums\InstitutionStatus;
use App\Events\InstitutionMembershipRequested;
use App\Events\InstitutionMembershipVerified;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionDomain;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Support\Facades\Event;

test('a verified student is verified by an exact approved institution domain', function () {
    $user = User::factory()->create(['email' => 'Student@Kampus.Ac.Id']);
    $institution = Institution::factory()->active()->create();
    InstitutionDomain::factory()->verified()->for($institution)->create(['domain' => 'kampus.ac.id']);

    $membership = app(RequestInstitutionMembership::class)->handle($user, $institution);

    expect($membership->status)->toBe(InstitutionMembershipStatus::Verified)
        ->and($membership->role)->toBe(InstitutionMembershipRole::Student)
        ->and($membership->verification_method)
        ->toBe(InstitutionMembershipVerificationMethod::ApprovedDomain)
        ->and($membership->institution_id)->toBe($institution->getKey())
        ->and(AuditLog::query()->pluck('operation')->all())
        ->toEqual([
            'institution_membership.requested',
            'institution_membership.verified_by_domain',
        ]);

    expect(AuditLog::query()->get()->flatMap(
        fn (AuditLog $audit): array => [$audit->before_summary, $audit->after_summary],
    )->toJson())->not->toContain('kampus.ac.id');
});

test('a subdomain does not match a bare approved domain', function () {
    $user = User::factory()->create(['email' => 'student@engineering.kampus.ac.id']);
    $institution = Institution::factory()->active()->create();
    InstitutionDomain::factory()->verified()->for($institution)->create(['domain' => 'kampus.ac.id']);

    $membership = app(RequestInstitutionMembership::class)->handle($user, $institution);

    expect($membership->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($membership->verification_method)->toBeNull();
});

test('malformed email domains never match an approved domain', function (string $email) {
    $user = User::factory()->create(['email' => $email]);
    $institution = Institution::factory()->active()->create();
    InstitutionDomain::factory()->verified()->for($institution)->create(['domain' => 'kampus.ac.id']);

    $membership = app(RequestInstitutionMembership::class)->handle($user, $institution);

    expect($membership->status)->toBe(InstitutionMembershipStatus::Pending);
})->with([
    'multiple at signs' => 'student@@kampus.ac.id',
    'whitespace' => 'student @kampus.ac.id',
    'double trailing dot' => 'student@kampus.ac.id..',
]);

test('an unapproved domain falls back to a pending membership', function () {
    $user = User::factory()->create(['email' => 'student@other.ac.id']);
    $institution = Institution::factory()->active()->create();

    $membership = app(RequestInstitutionMembership::class)->handle($user, $institution);

    expect($membership->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($membership->requested_at)->not->toBeNull()
        ->and($membership->verification_method)->toBeNull()
        ->and(AuditLog::query()->sole()->operation)->toBe('institution_membership.requested');
});

test('only verified domains belonging to the selected institution are eligible', function () {
    $user = User::factory()->create(['email' => 'student@campus.ac.id']);
    $selected = Institution::factory()->active()->create();
    $other = Institution::factory()->active()->create();
    InstitutionDomain::factory()->verified()->for($other)->create(['domain' => 'campus.ac.id']);

    $membership = app(RequestInstitutionMembership::class)->handle($user, $selected);

    expect($membership->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($membership->institution_id)->toBe($selected->getKey());
});

test('pending and verified requests are idempotent without duplicate audit records', function () {
    $pendingUser = User::factory()->create(['email' => 'pending@example.test']);
    $institution = Institution::factory()->active()->create();

    $firstPending = app(RequestInstitutionMembership::class)->handle($pendingUser, $institution);
    $secondPending = app(RequestInstitutionMembership::class)->handle($pendingUser, $institution);

    expect($secondPending->is($firstPending))->toBeTrue()
        ->and(InstitutionMembership::query()->whereBelongsTo($pendingUser)->count())->toBe(1)
        ->and(AuditLog::query()->count())->toBe(1);

    $verifiedUser = User::factory()->create(['email' => 'verified@campus.ac.id']);
    InstitutionDomain::factory()->verified()->for($institution)->create(['domain' => 'campus.ac.id']);

    $firstVerified = app(RequestInstitutionMembership::class)->handle($verifiedUser, $institution);
    $secondVerified = app(RequestInstitutionMembership::class)->handle($verifiedUser, $institution);

    expect($secondVerified->is($firstVerified))->toBeTrue()
        ->and(InstitutionMembership::query()->whereBelongsTo($verifiedUser)->count())->toBe(1)
        ->and(AuditLog::query()->count())->toBe(3);
});

test('a pending membership remains pending on repeated request even after domain approval', function () {
    $user = User::factory()->create(['email' => 'pending@campus.ac.id']);
    $institution = Institution::factory()->active()->create();

    $pending = app(RequestInstitutionMembership::class)->handle($user, $institution);
    InstitutionDomain::factory()->verified()->for($institution)->create(['domain' => 'campus.ac.id']);

    $repeated = app(RequestInstitutionMembership::class)->handle($user, $institution);

    expect($repeated->is($pending))->toBeTrue()
        ->and($repeated->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and(AuditLog::query()->count())->toBe(1);
});

test('a rejected unverified membership may retry while a suspended membership is denied', function () {
    $user = User::factory()->create(['email' => 'student@example.test']);
    $institution = Institution::factory()->active()->create();
    $rejected = InstitutionMembership::factory()->rejected()->for($user)->for($institution)->create();

    $retried = app(RequestInstitutionMembership::class)->handle($user, $institution);

    expect($retried->is($rejected))->toBeTrue()
        ->and($retried->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($retried->last_review_outcome)->toBeNull();

    $suspendedUser = User::factory()->create(['email' => 'suspended@example.test']);
    $suspended = InstitutionMembership::factory()->suspended()->for($suspendedUser)->for($institution)->create();

    expect(fn () => app(RequestInstitutionMembership::class)->handle($suspendedUser, $institution))
        ->toThrow(AuthorizationException::class);
});

test('unverified users cannot request affiliation', function () {
    $user = User::factory()->unverified()->create();
    $institution = Institution::factory()->active()->create();

    expect(fn () => app(RequestInstitutionMembership::class)->handle($user, $institution))
        ->toThrow(AuthorizationException::class)
        ->and(InstitutionMembership::query()->count())->toBe(0);
});

test('inactive institutions cannot receive requests', function (InstitutionStatus $status) {
    $user = User::factory()->create();
    $institution = Institution::factory()->create(['status' => $status]);

    expect(fn () => app(RequestInstitutionMembership::class)->handle($user, $institution))
        ->toThrow(AuthorizationException::class);
})->with([
    'pending' => InstitutionStatus::Pending,
    'suspended' => InstitutionStatus::Suspended,
    'archived' => InstitutionStatus::Archived,
]);

test('the request route requires verified authentication and ignores privileged input', function () {
    $institution = Institution::factory()->active()->create();
    $unverified = User::factory()->unverified()->create();

    $this->actingAs($unverified)
        ->post(route('institution-memberships.store'), [
            'institution_id' => $institution->getKey(),
        ])
        ->assertRedirect(route('verification.notice'));

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('institution-memberships.store'), [
            'institution_id' => $institution->getKey(),
            'role' => InstitutionMembershipRole::CampusAdmin->value,
            'status' => InstitutionMembershipStatus::Verified->value,
            'verification_method' => InstitutionMembershipVerificationMethod::CampusAdminReview->value,
        ])
        ->assertRedirect(route('onboarding.show'))
        ->assertSessionHas('membership_status', InstitutionMembershipStatus::Pending->value);

    $membership = InstitutionMembership::query()->whereBelongsTo($user)->sole();

    expect($membership->role)->toBe(InstitutionMembershipRole::Student)
        ->and($membership->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($membership->verification_method)->toBeNull();
});

test('an expired CSRF session returns safe onboarding recovery without mutation', function () {
    $this->app['env'] = 'local';

    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    $this->actingAs($user)
        ->from(route('onboarding.show'))
        ->withHeaders(['X-Inertia' => 'true'])
        ->post(route('institution-memberships.store'), [
            'institution_id' => $institution->getKey(),
        ])
        ->assertRedirect(route('onboarding.show'))
        ->assertSessionHas('onboarding_recovery', 'session_expired');

    expect(InstitutionMembership::query()->count())->toBe(0)
        ->and(AuditLog::query()->count())->toBe(0);
});

test('a permission loss returns safe onboarding recovery without mutation', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $membership = InstitutionMembership::factory()
        ->suspended()
        ->for($user)
        ->for($institution)
        ->create();
    Event::fake();

    $this->actingAs($user)
        ->from(route('onboarding.show'))
        ->withHeaders(['X-Inertia' => 'true'])
        ->post(route('institution-memberships.store'), [
            'institution_id' => $institution->getKey(),
        ])
        ->assertRedirect(route('onboarding.show'))
        ->assertSessionHas('onboarding_recovery', 'forbidden');

    expect($membership->refresh()->status)->toBe(InstitutionMembershipStatus::Suspended)
        ->and(InstitutionMembership::query()->count())->toBe(1)
        ->and(AuditLog::query()->count())->toBe(0);
    Event::assertNotDispatched(InstitutionMembershipRequested::class);
    Event::assertNotDispatched(InstitutionMembershipVerified::class);
});

test('the request route validates only active institution selections', function () {
    $user = User::factory()->create();
    $inactive = Institution::factory()->create();

    $this->actingAs($user)
        ->post(route('institution-memberships.store'), ['institution_id' => $inactive->getKey()])
        ->assertSessionHasErrors('institution_id');

    $this->actingAs($user)
        ->post(route('institution-memberships.store'), ['institution_id' => 999999])
        ->assertSessionHasErrors('institution_id');
});

test('duplicate HTTP requests create one membership and one requested audit record', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $payload = ['institution_id' => $institution->getKey()];

    $this->actingAs($user)
        ->post(route('institution-memberships.store'), $payload)
        ->assertRedirect(route('onboarding.show'));
    $this->actingAs($user)
        ->post(route('institution-memberships.store'), $payload)
        ->assertRedirect(route('onboarding.show'));

    expect(InstitutionMembership::query()->whereBelongsTo($user)->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'institution_membership.requested')->count())
        ->toBe(1);
});

test('rejected affiliation retries once without duplicate events or audit history', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $membership = InstitutionMembership::factory()
        ->rejected()
        ->for($user)
        ->for($institution)
        ->create();
    Event::fake();

    $this->actingAs($user)
        ->post(route('institution-memberships.store'), [
            'institution_id' => $institution->getKey(),
        ])
        ->assertRedirect(route('onboarding.show'));
    $this->actingAs($user)
        ->post(route('institution-memberships.store'), [
            'institution_id' => $institution->getKey(),
        ])
        ->assertRedirect(route('onboarding.show'));

    expect($membership->refresh()->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and(AuditLog::query()->pluck('operation')->all())
        ->toEqual(['institution_membership.requested']);
    Event::assertDispatchedTimes(InstitutionMembershipRequested::class, 1);
    Event::assertNotDispatched(InstitutionMembershipVerified::class);
});

test('an inactive campus retry is rejected without mutating membership or audit history', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $membership = InstitutionMembership::factory()
        ->rejected()
        ->for($user)
        ->for($institution)
        ->create();
    $institution->update(['status' => InstitutionStatus::Suspended]);
    Event::fake();

    $this->actingAs($user)
        ->post(route('institution-memberships.store'), [
            'institution_id' => $institution->getKey(),
        ])
        ->assertSessionHasErrors('institution_id');

    expect($membership->refresh()->status)->toBe(InstitutionMembershipStatus::Unverified)
        ->and($membership->last_review_outcome?->value)->toBe('rejected')
        ->and(AuditLog::query()->count())->toBe(0);
    Event::assertNotDispatched(InstitutionMembershipRequested::class);
    Event::assertNotDispatched(InstitutionMembershipVerified::class);
});

test('membership request rate limiting is isolated per authenticated user', function () {
    $limitedUser = User::factory()->create();
    $otherUser = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $payload = ['institution_id' => $institution->getKey()];

    foreach (range(1, 5) as $attempt) {
        $this->actingAs($limitedUser)
            ->post(route('institution-memberships.store'), $payload)
            ->assertRedirect(route('onboarding.show'));
    }

    $this->actingAs($limitedUser)
        ->post(route('institution-memberships.store'), $payload)
        ->assertTooManyRequests();

    $this->actingAs($otherUser)
        ->post(route('institution-memberships.store'), $payload)
        ->assertRedirect(route('onboarding.show'));

    expect(InstitutionMembership::query()->whereBelongsTo($limitedUser)->count())->toBe(1)
        ->and(InstitutionMembership::query()->whereBelongsTo($otherUser)->count())->toBe(1)
        ->and(AuditLog::query()->where('operation', 'institution_membership.requested')->count())
        ->toBe(2);
});

test('privileged and cross-user identifiers cannot redirect an affiliation request', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $otherMembership = InstitutionMembership::factory()
        ->pending()
        ->for($otherUser)
        ->for($institution)
        ->create();

    $this->actingAs($user)
        ->post(route('institution-memberships.store'), [
            'institution_id' => $institution->getKey(),
            'user_id' => $otherUser->getKey(),
            'membership_id' => $otherMembership->getKey(),
        ])
        ->assertRedirect(route('onboarding.show'));

    expect($otherMembership->refresh()->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and(
            InstitutionMembership::query()
                ->whereBelongsTo($user)
                ->whereBelongsTo($institution)
                ->sole()
                ->user_id,
        )
        ->toBe($user->getKey());
});

test('a suspended membership is denied without exposing membership internals', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()->suspended()->for($user)->for($institution)->create();

    $response = $this->actingAs($user)
        ->post(route('institution-memberships.store'), ['institution_id' => $institution->getKey()]);

    $response->assertForbidden();
    expect($response->getContent())->not->toContain('verification_method')
        ->and($response->getContent())->not->toContain('status');
});

test('membership boundary events expose ids and dispatch after commit', function () {
    $user = User::factory()->create(['email' => 'student@campus.ac.id']);
    $institution = Institution::factory()->active()->create();
    InstitutionDomain::factory()->verified()->for($institution)->create(['domain' => 'campus.ac.id']);

    expect(new InstitutionMembershipRequested(1, 2, 3, InstitutionMembershipStatus::Verified))
        ->toBeInstanceOf(ShouldDispatchAfterCommit::class)
        ->and(new InstitutionMembershipVerified(1, 2, 3, InstitutionMembershipStatus::Verified))
        ->toBeInstanceOf(ShouldDispatchAfterCommit::class);

    Event::fake();
    app(RequestInstitutionMembership::class)->handle($user, $institution);

    Event::assertDispatched(InstitutionMembershipRequested::class, fn (
        InstitutionMembershipRequested $event,
    ): bool => $event->userId === $user->getKey()
        && $event->institutionId === $institution->getKey()
        && $event->status === InstitutionMembershipStatus::Verified);
    Event::assertDispatched(InstitutionMembershipVerified::class, fn (
        InstitutionMembershipVerified $event,
    ): bool => $event->userId === $user->getKey()
        && $event->institutionId === $institution->getKey()
        && $event->status === InstitutionMembershipStatus::Verified);
});
