<?php

use App\Actions\InstitutionMemberships\RequestInstitutionMembership;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Events\InstitutionMembershipRequested;
use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Support\Facades\Event;

test('a student requesting affiliation to an active institution gets a pending membership', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    $membership = app(RequestInstitutionMembership::class)->handle($user, $institution);

    expect($membership->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($membership->role)->toBe(InstitutionMembershipRole::Student)
        ->and($membership->user_id)->toBe($user->getKey())
        ->and($membership->institution_id)->toBe($institution->getKey())
        ->and($membership->verification_method)->toBeNull()
        ->and(AuditLog::query()->pluck('operation')->all())
        ->toEqual(['institution_membership.requested']);
});

test('requesting affiliation to a suspended institution is denied', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Suspended]);

    expect(fn () => app(RequestInstitutionMembership::class)->handle($user, $institution))
        ->toThrow(AuthorizationException::class, 'not accepting affiliation');
});

test('requesting affiliation to a pending institution is denied', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Pending]);

    expect(fn () => app(RequestInstitutionMembership::class)->handle($user, $institution))
        ->toThrow(AuthorizationException::class, 'not accepting affiliation');
});

test('pending and verified requests are idempotent without duplicate audit records', function () {
    $pendingUser = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    $firstPending = app(RequestInstitutionMembership::class)->handle($pendingUser, $institution);
    $secondPending = app(RequestInstitutionMembership::class)->handle($pendingUser, $institution);

    expect($secondPending->is($firstPending))->toBeTrue()
        ->and(InstitutionMembership::query()->whereBelongsTo($pendingUser)->count())->toBe(1)
        ->and(AuditLog::query()->count())->toBe(1);

    $verifiedUser = User::factory()->create();
    $verified = InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->for($verifiedUser)
        ->for($institution)
        ->create();

    $result = app(RequestInstitutionMembership::class)->handle($verifiedUser, $institution);

    expect($result->is($verified))->toBeTrue()
        ->and(AuditLog::query()->whereBelongsTo($pendingUser)->count())->toBe(1);
});

test('a suspended membership cannot be re-requested', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()->suspended()->for($user)->for($institution)->create();

    expect(fn () => app(RequestInstitutionMembership::class)->handle($user, $institution))
        ->toThrow(AuthorizationException::class, 'cannot be requested again');
});

test('unverified request can be retried after rejection', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()->rejected()->for($user)->for($institution)->create();

    $membership = app(RequestInstitutionMembership::class)->handle($user, $institution);

    expect($membership->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($membership->requested_at)->not->toBeNull()
        ->and($membership->verification_method)->toBeNull()
        ->and(AuditLog::query()->sole()->operation)->toBe('institution_membership.requested');
});

test('creating a membership under a duplicate race falls back to the existing record', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    $concurrent = InstitutionMembership::factory()
        ->pending()
        ->for($user)
        ->for($institution)
        ->make();

    /** @var array<int, InstitutionMembership> $results */
    $results = [];
    DB::transaction(function () use ($user, $institution, $concurrent, &$results) {
        $first = InstitutionMembership::factory()
            ->unverified()
            ->for($user)
            ->for($institution)
            ->create();

        $results[] = app(RequestInstitutionMembership::class)->handle($user, $institution);
    }, attempts: 1);

    expect($results)->toHaveCount(1)
        ->and($results[0]->user_id)->toBe($user->getKey());
});

test('membership request rejects an archived institution', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->create(['status' => InstitutionStatus::Archived]);

    expect(fn () => app(RequestInstitutionMembership::class)->handle($user, $institution))
        ->toThrow(AuthorizationException::class, 'not accepting affiliation');
});

test('unverified membership transitions to pending on request', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    $membership = InstitutionMembership::factory()->unverified()->for($user)->for($institution)->create();

    $result = app(RequestInstitutionMembership::class)->handle($user, $institution);

    expect($result->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($result->requested_at)->not->toBeNull()
        ->and($result->is($membership))->toBeTrue();
});

// --- HTTP request tests ---

test('authenticated student can request institution membership', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    $this->actingAs($user)
        ->post(route('institution-memberships.store'), ['institution_id' => $institution->getKey()])
        ->assertRedirect(route('onboarding.show'));

    $membership = InstitutionMembership::query()
        ->whereBelongsTo($user)
        ->whereBelongsTo($institution)
        ->firstOrFail();

    expect($membership->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($membership->role)->toBe(InstitutionMembershipRole::Student);
});

test('unauthenticated users cannot request membership', function () {
    $institution = Institution::factory()->active()->create();

    $this->post(route('institution-memberships.store'), ['institution_id' => $institution->getKey()])
        ->assertRedirect(route('login'));

    expect(InstitutionMembership::query()->count())->toBe(0);
});

test('membership request validates required institution_id', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('institution-memberships.store'), [])
        ->assertSessionHasErrors('institution_id');
});

test('membership request validates institution_id exists and is active', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('institution-memberships.store'), ['institution_id' => 99999])
        ->assertSessionHasErrors('institution_id');

    $suspended = Institution::factory()->create(['status' => InstitutionStatus::Suspended]);

    $this->actingAs($user)
        ->post(route('institution-memberships.store'), ['institution_id' => $suspended->getKey()])
        ->assertSessionHasErrors('institution_id');
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
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();

    expect(new InstitutionMembershipRequested(1, 2, 3, InstitutionMembershipStatus::Pending))
        ->toBeInstanceOf(ShouldDispatchAfterCommit::class);

    Event::fake();
    app(RequestInstitutionMembership::class)->handle($user, $institution);

    Event::assertDispatched(InstitutionMembershipRequested::class, fn (
        InstitutionMembershipRequested $event,
    ): bool => $event->userId === $user->getKey()
        && $event->institutionId === $institution->getKey()
        && $event->status === InstitutionMembershipStatus::Pending);
});
