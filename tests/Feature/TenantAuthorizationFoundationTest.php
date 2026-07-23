<?php

use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Models\Institution;
use App\Models\InstitutionDomain;
use App\Models\InstitutionMembership;
use App\Models\User;
use App\Policies\InstitutionContextResolver;
use Illuminate\Support\Facades\Gate;

test('verified campus admin receives context and policy access for the same institution', function () {
    $institution = Institution::factory()->active()->create();
    $user = User::factory()->create();
    $membership = InstitutionMembership::factory()
        ->for($institution)
        ->for($user)
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->create();
    $domain = InstitutionDomain::factory()->for($institution)->create();

    $context = app(InstitutionContextResolver::class)->resolve(
        $user,
        $domain,
        [InstitutionMembershipRole::CampusAdmin],
    );

    expect($context)->not->toBeNull()
        ->and($context?->actor->is($user))->toBeTrue()
        ->and($context?->institution->is($institution))->toBeTrue()
        ->and($context?->membership->is($membership))->toBeTrue()
        ->and(Gate::forUser($user)->allows('update', $domain))->toBeTrue();
});

test('route-bound institution resolves context without accepting a free-form identifier', function () {
    $institution = Institution::factory()->active()->create();
    $user = User::factory()->create();
    InstitutionMembership::factory()
        ->for($institution)
        ->for($user)
        ->student()
        ->verifiedByApprovedDomain()
        ->create();

    $context = app(InstitutionContextResolver::class)->resolve(
        $user,
        $institution,
        [InstitutionMembershipRole::Student],
    );

    expect($context)->not->toBeNull()
        ->and($context?->institution->is($institution))->toBeTrue();
});

test('cross-tenant resources are denied even when the actor is an admin elsewhere', function () {
    $actorInstitution = Institution::factory()->active()->create();
    $resourceInstitution = Institution::factory()->active()->create();
    $user = User::factory()->create();
    InstitutionMembership::factory()
        ->for($actorInstitution)
        ->for($user)
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->create();
    $foreignDomain = InstitutionDomain::factory()
        ->for($resourceInstitution)
        ->create();

    expect(Gate::forUser($user)->denies('update', $foreignDomain))->toBeTrue();
});

test('missing context stays denied even when request input and headers forge an institution', function () {
    $institution = Institution::factory()->active()->create();
    $user = User::factory()->create();
    InstitutionMembership::factory()
        ->for($institution)
        ->for($user)
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->create();

    request()->merge(['institution_id' => $institution->getKey()]);
    request()->headers->set('X-Institution-Id', (string) $institution->getKey());

    $context = app(InstitutionContextResolver::class)->resolve(
        $user,
        null,
        [InstitutionMembershipRole::CampusAdmin],
    );

    expect(request()->integer('institution_id'))->toBe($institution->getKey())
        ->and(request()->header('X-Institution-Id'))->toBe((string) $institution->getKey())
        ->and($context)->toBeNull();
});

test('privileged access requires a verified membership', function (string $state) {
    $institution = Institution::factory()->active()->create();
    $user = User::factory()->create();
    InstitutionMembership::factory()
        ->for($institution)
        ->for($user)
        ->campusAdmin()
        ->{$state}()
        ->create();
    $domain = InstitutionDomain::factory()->for($institution)->create();

    expect(Gate::forUser($user)->denies('update', $domain))->toBeTrue();
})->with([
    'unverified' => 'unverified',
    'pending' => 'pending',
    'suspended' => 'suspended',
]);

test('privileged access denies verified membership with the wrong role', function () {
    $institution = Institution::factory()->active()->create();
    $user = User::factory()->create();
    InstitutionMembership::factory()
        ->for($institution)
        ->for($user)
        ->student()
        ->verifiedByApprovedDomain()
        ->create();
    $domain = InstitutionDomain::factory()->for($institution)->create();

    expect(Gate::forUser($user)->denies('update', $domain))->toBeTrue();
});

test('inactive institutions cannot produce a privileged context', function () {
    $institution = Institution::factory()->suspended()->create();
    $user = User::factory()->create();
    InstitutionMembership::factory()
        ->for($institution)
        ->for($user)
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->create();
    $domain = InstitutionDomain::factory()->for($institution)->create();

    expect(Gate::forUser($user)->denies('update', $domain))->toBeTrue();
});

test('tenant-owned queries require explicit local institution scoping', function () {
    $firstInstitution = Institution::factory()->active()->create();
    $secondInstitution = Institution::factory()->active()->create();
    $firstDomain = InstitutionDomain::factory()->for($firstInstitution)->create();
    InstitutionDomain::factory()->for($secondInstitution)->create();
    $firstMembership = InstitutionMembership::factory()
        ->for($firstInstitution)
        ->create();
    InstitutionMembership::factory()
        ->for($secondInstitution)
        ->create();

    expect(InstitutionDomain::query()->forInstitution($firstInstitution)->sole()->is($firstDomain))
        ->toBeTrue()
        ->and(InstitutionMembership::query()->forInstitution($firstInstitution)->sole()->is($firstMembership))
        ->toBeTrue()
        ->and(InstitutionDomain::query()->count())->toBe(2)
        ->and(InstitutionMembership::query()->count())->toBe(2);
});

test('mass assignment cannot change persisted membership identity ownership role or status', function () {
    $membership = InstitutionMembership::factory()->create();
    $originalUser = $membership->user;
    $originalInstitution = $membership->institution;
    $foreignUser = User::factory()->create();
    $foreignInstitution = Institution::factory()->active()->create();

    $membership->fill([
        'user_id' => $foreignUser->getKey(),
        'institution_id' => $foreignInstitution->getKey(),
        'institutional_identifier' => 'SATU-2026-001',
        'role' => InstitutionMembershipRole::CampusAdmin,
        'status' => InstitutionMembershipStatus::Verified,
    ])->save();

    $membership->refresh();

    expect($membership->user->is($originalUser))->toBeTrue()
        ->and($membership->institution->is($originalInstitution))->toBeTrue()
        ->and($membership->role)->toBe(InstitutionMembershipRole::Student)
        ->and($membership->status)->toBe(InstitutionMembershipStatus::Unverified)
        ->and($membership->institutional_identifier)->toBe('SATU-2026-001');
});

test('mass assignment cannot change persisted institution domain ownership', function () {
    $domain = InstitutionDomain::factory()->create();
    $originalInstitution = $domain->institution;
    $foreignInstitution = Institution::factory()->active()->create();

    $domain->fill([
        'institution_id' => $foreignInstitution->getKey(),
        'domain' => 'updated.example',
    ])->save();

    $domain->refresh();

    expect($domain->institution->is($originalInstitution))->toBeTrue()
        ->and($domain->domain)->toBe('updated.example');
});

test('dirty in-memory ownership cannot forge policy access to another tenant', function () {
    $resourceInstitution = Institution::factory()->active()->create();
    $actorInstitution = Institution::factory()->active()->create();
    $user = User::factory()->create();
    InstitutionMembership::factory()
        ->for($actorInstitution)
        ->for($user)
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->create();
    $domain = InstitutionDomain::factory()
        ->for($resourceInstitution)
        ->create();

    $domain->forceFill(['institution_id' => $actorInstitution->getKey()]);

    expect($domain->isDirty('institution_id'))->toBeTrue()
        ->and(Gate::forUser($user)->denies('update', $domain))->toBeTrue()
        ->and($domain->getOriginal('institution_id'))->toBe($resourceInstitution->getKey());
});

test('stale ownership is denied until the resource is reloaded from the database', function () {
    $originalInstitution = Institution::factory()->active()->create();
    $newInstitution = Institution::factory()->active()->create();
    $originalAdmin = User::factory()->create();
    $newAdmin = User::factory()->create();
    InstitutionMembership::factory()
        ->for($originalInstitution)
        ->for($originalAdmin)
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->create();
    InstitutionMembership::factory()
        ->for($newInstitution)
        ->for($newAdmin)
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->create();
    $domain = InstitutionDomain::factory()
        ->for($originalInstitution)
        ->create();

    InstitutionDomain::query()
        ->whereKey($domain->getKey())
        ->update(['institution_id' => $newInstitution->getKey()]);

    expect($domain->isDirty('institution_id'))->toBeFalse()
        ->and($domain->institution_id)->toBe($originalInstitution->getKey())
        ->and(Gate::forUser($originalAdmin)->denies('update', $domain))->toBeTrue()
        ->and(Gate::forUser($newAdmin)->denies('update', $domain))->toBeTrue();

    $domain->refresh();

    expect(Gate::forUser($newAdmin)->allows('update', $domain))->toBeTrue();
});

test('a missing persisted resource cannot produce policy access from a stale model', function () {
    $institution = Institution::factory()->active()->create();
    $user = User::factory()->create();
    InstitutionMembership::factory()
        ->for($institution)
        ->for($user)
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->create();
    $domain = InstitutionDomain::factory()
        ->for($institution)
        ->create();

    InstitutionDomain::query()
        ->whereKey($domain->getKey())
        ->delete();

    expect($domain->exists)->toBeTrue()
        ->and(Gate::forUser($user)->denies('update', $domain))->toBeTrue();
});

test('a dirty route key cannot redirect policy authorization to another resource', function () {
    $institution = Institution::factory()->active()->create();
    $user = User::factory()->create();
    InstitutionMembership::factory()
        ->for($institution)
        ->for($user)
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->create();
    $domain = InstitutionDomain::factory()
        ->for($institution)
        ->create();
    $otherDomain = InstitutionDomain::factory()
        ->for($institution)
        ->create();

    $domain->forceFill([$domain->getKeyName() => $otherDomain->getKey()]);

    expect($domain->isDirty($domain->getKeyName()))->toBeTrue()
        ->and(Gate::forUser($user)->denies('update', $domain))->toBeTrue();
});

test('trusted relationships and factories can establish immutable ownership', function () {
    $institution = Institution::factory()->active()->create();
    $user = User::factory()->create();

    $domain = $institution->domains()->create([
        'domain' => 'trusted.example',
    ]);

    $membership = $institution->memberships()->make([
        'institutional_identifier' => 'SATU-TRUSTED-001',
    ]);
    $membership->user()->associate($user);
    $membership->save();

    $factoryMembership = InstitutionMembership::factory()
        ->for($institution)
        ->for($user)
        ->campusAdmin()
        ->create();

    expect($domain->institution->is($institution))->toBeTrue()
        ->and($membership->institution->is($institution))->toBeTrue()
        ->and($membership->user->is($user))->toBeTrue()
        ->and($factoryMembership->institution->is($institution))->toBeTrue()
        ->and($factoryMembership->user->is($user))->toBeTrue();
});

test('users without an explicit membership receive no platform or cross-tenant bypass', function () {
    $institution = Institution::factory()->active()->create();
    $domain = InstitutionDomain::factory()->for($institution)->create();
    $user = User::factory()->create();

    expect(Gate::forUser($user)->denies('update', $domain))->toBeTrue();
});
