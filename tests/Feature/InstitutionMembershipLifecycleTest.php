<?php

use App\Actions\InstitutionMemberships\TransitionInstitutionMembership;
use App\Enums\InstitutionMembershipReviewOutcome;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Exceptions\InvalidInstitutionMembershipTransition;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;

test('membership schema exposes canonical defaults casts and indexes', function () {
    $membership = InstitutionMembership::factory()->create([
        'institutional_identifier' => 'SATU-2026-001',
    ]);

    expect(Schema::hasColumns('institution_memberships', [
        'user_id',
        'institution_id',
        'role',
        'status',
        'institutional_identifier',
        'requested_at',
        'reviewed_at',
        'reviewed_by_id',
        'verified_at',
        'verification_method',
        'last_review_outcome',
    ]))->toBeTrue()
        ->and($membership->role)->toBe(InstitutionMembershipRole::Student)
        ->and($membership->status)->toBe(InstitutionMembershipStatus::Unverified)
        ->and($membership->institutional_identifier)->toBe('SATU-2026-001')
        ->and($membership->requested_at)->toBeNull()
        ->and($membership->reviewed_at)->toBeNull()
        ->and($membership->verified_at)->toBeNull()
        ->and($membership->verification_method)->toBeNull()
        ->and($membership->last_review_outcome)->toBeNull();

    $indexes = collect(Schema::getIndexes('institution_memberships'))
        ->map(fn (array $index): array => $index['columns'])
        ->values();

    expect($indexes->contains(['user_id', 'institution_id', 'role']))->toBeTrue()
        ->and($indexes->contains(['institution_id', 'status']))->toBeTrue()
        ->and($indexes->contains(['user_id', 'status']))->toBeTrue();
});

test('membership belongs to user institution and optional reviewer', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->create();
    $reviewer = User::factory()->create();
    $membership = InstitutionMembership::factory()
        ->for($user)
        ->for($institution)
        ->verifiedByCampusAdmin($reviewer)
        ->create();

    expect($membership->user->is($user))->toBeTrue()
        ->and($membership->institution->is($institution))->toBeTrue()
        ->and($institution->memberships()->sole()->is($membership))->toBeTrue()
        ->and($user->institutionMemberships()->sole()->is($membership))->toBeTrue()
        ->and($membership->reviewer->is($reviewer))->toBeTrue();
});

test('membership role factory states use canonical roles', function (
    string $state,
    InstitutionMembershipRole $expectedRole,
) {
    $membership = InstitutionMembership::factory()->{$state}()->create();

    expect($membership->role)->toBe($expectedRole);
})->with([
    'student' => ['student', InstitutionMembershipRole::Student],
    'campus admin' => ['campusAdmin', InstitutionMembershipRole::CampusAdmin],
]);

test('membership status factory states keep coherent provenance', function (
    string $state,
    InstitutionMembershipStatus $expectedStatus,
    ?InstitutionMembershipVerificationMethod $expectedMethod,
    ?InstitutionMembershipReviewOutcome $expectedOutcome,
) {
    $membership = InstitutionMembership::factory()->{$state}()->create();

    expect($membership->status)->toBe($expectedStatus)
        ->and($membership->verification_method)->toBe($expectedMethod)
        ->and($membership->last_review_outcome)->toBe($expectedOutcome);

    if ($expectedStatus === InstitutionMembershipStatus::Pending) {
        expect($membership->requested_at)->not->toBeNull()
            ->and($membership->reviewed_at)->toBeNull()
            ->and($membership->verified_at)->toBeNull();
    }

    if ($expectedMethod !== null) {
        expect($membership->requested_at)->not->toBeNull()
            ->and($membership->verified_at)->not->toBeNull();
    }

    if ($expectedOutcome !== null) {
        expect($membership->requested_at)->not->toBeNull()
            ->and($membership->reviewed_at)->not->toBeNull()
            ->and($membership->reviewed_by_id)->not->toBeNull();
    }
})->with([
    'unverified' => [
        'unverified',
        InstitutionMembershipStatus::Unverified,
        null,
        null,
    ],
    'pending' => [
        'pending',
        InstitutionMembershipStatus::Pending,
        null,
        null,
    ],
    'approved domain' => [
        'verifiedByApprovedDomain',
        InstitutionMembershipStatus::Verified,
        InstitutionMembershipVerificationMethod::ApprovedDomain,
        null,
    ],
    'roster exact match' => [
        'verifiedByRosterExactMatch',
        InstitutionMembershipStatus::Verified,
        InstitutionMembershipVerificationMethod::RosterExactMatch,
        null,
    ],
    'campus review' => [
        'verifiedByCampusAdmin',
        InstitutionMembershipStatus::Verified,
        InstitutionMembershipVerificationMethod::CampusAdminReview,
        InstitutionMembershipReviewOutcome::Approved,
    ],
    'rejected' => [
        'rejected',
        InstitutionMembershipStatus::Unverified,
        null,
        InstitutionMembershipReviewOutcome::Rejected,
    ],
    'suspended' => [
        'suspended',
        InstitutionMembershipStatus::Suspended,
        InstitutionMembershipVerificationMethod::ApprovedDomain,
        null,
    ],
]);

test('duplicate membership for the same user institution and role is rejected', function () {
    $membership = InstitutionMembership::factory()->create();

    expect(fn () => InstitutionMembership::factory()
        ->for($membership->user)
        ->for($membership->institution)
        ->create([
            'role' => $membership->role,
        ]))->toThrow(QueryException::class);
});

test('the same user may hold distinct canonical roles at one institution', function () {
    $studentMembership = InstitutionMembership::factory()->student()->create();
    $adminMembership = InstitutionMembership::factory()
        ->for($studentMembership->user)
        ->for($studentMembership->institution)
        ->campusAdmin()
        ->create();

    expect($studentMembership->role)->toBe(InstitutionMembershipRole::Student)
        ->and($adminMembership->role)->toBe(InstitutionMembershipRole::CampusAdmin);
});

test('membership ownership prevents deletion of referenced users and institutions', function () {
    $membership = InstitutionMembership::factory()->create();

    expect(fn () => $membership->user->delete())->toThrow(QueryException::class)
        ->and(fn () => $membership->institution->delete())->toThrow(QueryException::class);

    $this->assertModelExists($membership->user);
    $this->assertModelExists($membership->institution);
});

test('review provenance prevents deletion of a referenced reviewer', function () {
    $reviewer = User::factory()->create();
    $membership = InstitutionMembership::factory()
        ->verifiedByCampusAdmin($reviewer)
        ->create();

    expect(fn () => $reviewer->delete())->toThrow(QueryException::class);

    expect($membership->fresh()->reviewed_by_id)->toBe($reviewer->getKey())
        ->and($membership->fresh()->last_review_outcome)
        ->toBe(InstitutionMembershipReviewOutcome::Approved);
    $this->assertModelExists($membership);
    $this->assertModelExists($reviewer);
});

test('an unverified membership may become pending with request provenance', function () {
    $membership = InstitutionMembership::factory()->unverified()->create();

    $transitioned = app(TransitionInstitutionMembership::class)->handle(
        $membership,
        InstitutionMembershipStatus::Pending,
    );

    expect($transitioned->status)->toBe(InstitutionMembershipStatus::Pending)
        ->and($transitioned->requested_at)->not->toBeNull()
        ->and($transitioned->reviewed_at)->toBeNull()
        ->and($transitioned->reviewed_by_id)->toBeNull()
        ->and($transitioned->verified_at)->toBeNull()
        ->and($transitioned->verification_method)->toBeNull()
        ->and($transitioned->last_review_outcome)->toBeNull();
});

test('an unverified membership may be verified by an approved domain', function () {
    $membership = InstitutionMembership::factory()->unverified()->create();

    $transitioned = app(TransitionInstitutionMembership::class)->handle(
        $membership,
        InstitutionMembershipStatus::Verified,
        InstitutionMembershipVerificationMethod::ApprovedDomain,
    );

    expect($transitioned->status)->toBe(InstitutionMembershipStatus::Verified)
        ->and($transitioned->requested_at)->not->toBeNull()
        ->and($transitioned->verified_at)->not->toBeNull()
        ->and($transitioned->verification_method)
        ->toBe(InstitutionMembershipVerificationMethod::ApprovedDomain)
        ->and($transitioned->reviewed_at)->toBeNull()
        ->and($transitioned->reviewed_by_id)->toBeNull()
        ->and($transitioned->last_review_outcome)->toBeNull();
});

test('a pending membership may be verified by an exact roster match', function () {
    $membership = InstitutionMembership::factory()->pending()->create();
    $requestedAt = $membership->requested_at;

    $transitioned = app(TransitionInstitutionMembership::class)->handle(
        $membership,
        InstitutionMembershipStatus::Verified,
        InstitutionMembershipVerificationMethod::RosterExactMatch,
    );

    expect($transitioned->status)->toBe(InstitutionMembershipStatus::Verified)
        ->and($transitioned->requested_at?->equalTo($requestedAt))->toBeTrue()
        ->and($transitioned->verified_at)->not->toBeNull()
        ->and($transitioned->verification_method)
        ->toBe(InstitutionMembershipVerificationMethod::RosterExactMatch)
        ->and($transitioned->reviewed_at)->toBeNull()
        ->and($transitioned->reviewed_by_id)->toBeNull()
        ->and($transitioned->last_review_outcome)->toBeNull();
});

test('an unverified membership may be verified by campus review', function () {
    $membership = InstitutionMembership::factory()->unverified()->create();
    $reviewer = User::factory()->create();

    $transitioned = app(TransitionInstitutionMembership::class)->handle(
        $membership,
        InstitutionMembershipStatus::Verified,
        InstitutionMembershipVerificationMethod::CampusAdminReview,
        $reviewer,
    );

    expect($transitioned->status)->toBe(InstitutionMembershipStatus::Verified)
        ->and($transitioned->requested_at)->not->toBeNull()
        ->and($transitioned->verified_at)->not->toBeNull()
        ->and($transitioned->verification_method)
        ->toBe(InstitutionMembershipVerificationMethod::CampusAdminReview)
        ->and($transitioned->reviewed_at)->not->toBeNull()
        ->and($transitioned->reviewer->is($reviewer))->toBeTrue()
        ->and($transitioned->last_review_outcome)
        ->toBe(InstitutionMembershipReviewOutcome::Approved);
});

test('a pending membership may be approved without losing request provenance', function () {
    $membership = InstitutionMembership::factory()->pending()->create();
    $requestedAt = $membership->requested_at;
    $reviewer = User::factory()->create();

    $transitioned = app(TransitionInstitutionMembership::class)->handle(
        $membership,
        InstitutionMembershipStatus::Verified,
        InstitutionMembershipVerificationMethod::CampusAdminReview,
        $reviewer,
    );

    expect($transitioned->status)->toBe(InstitutionMembershipStatus::Verified)
        ->and($transitioned->requested_at?->equalTo($requestedAt))->toBeTrue()
        ->and($transitioned->reviewed_at)->not->toBeNull()
        ->and($transitioned->reviewer->is($reviewer))->toBeTrue()
        ->and($transitioned->verified_at)->not->toBeNull()
        ->and($transitioned->verification_method)
        ->toBe(InstitutionMembershipVerificationMethod::CampusAdminReview)
        ->and($transitioned->last_review_outcome)
        ->toBe(InstitutionMembershipReviewOutcome::Approved);
});

test('a pending membership may be rejected with review provenance', function () {
    $membership = InstitutionMembership::factory()->pending()->create();
    $requestedAt = $membership->requested_at;
    $reviewer = User::factory()->create();

    $transitioned = app(TransitionInstitutionMembership::class)->handle(
        $membership,
        InstitutionMembershipStatus::Unverified,
        reviewer: $reviewer,
    );

    expect($transitioned->status)->toBe(InstitutionMembershipStatus::Unverified)
        ->and($transitioned->requested_at?->equalTo($requestedAt))->toBeTrue()
        ->and($transitioned->reviewed_at)->not->toBeNull()
        ->and($transitioned->reviewer->is($reviewer))->toBeTrue()
        ->and($transitioned->verified_at)->toBeNull()
        ->and($transitioned->verification_method)->toBeNull()
        ->and($transitioned->last_review_outcome)
        ->toBe(InstitutionMembershipReviewOutcome::Rejected);
});

test('suspension and reinstatement preserve original verification provenance', function () {
    $membership = InstitutionMembership::factory()
        ->verifiedByApprovedDomain()
        ->create();
    $verifiedAt = $membership->verified_at;
    $verificationMethod = $membership->verification_method;

    $suspended = app(TransitionInstitutionMembership::class)->handle(
        $membership,
        InstitutionMembershipStatus::Suspended,
    );
    $reinstated = app(TransitionInstitutionMembership::class)->handle(
        $suspended,
        InstitutionMembershipStatus::Verified,
    );

    expect($suspended->status)->toBe(InstitutionMembershipStatus::Suspended)
        ->and($suspended->verified_at?->equalTo($verifiedAt))->toBeTrue()
        ->and($suspended->verification_method)->toBe($verificationMethod)
        ->and($reinstated->status)->toBe(InstitutionMembershipStatus::Verified)
        ->and($reinstated->verified_at?->equalTo($verifiedAt))->toBeTrue()
        ->and($reinstated->verification_method)->toBe($verificationMethod);
});

test('invalid membership status transitions are rejected', function (
    string $factoryState,
    InstitutionMembershipStatus $targetStatus,
) {
    $membership = InstitutionMembership::factory()->{$factoryState}()->create();

    expect(fn () => app(TransitionInstitutionMembership::class)->handle(
        $membership,
        $targetStatus,
    ))->toThrow(InvalidInstitutionMembershipTransition::class);
})->with([
    'unverified to unverified' => ['unverified', InstitutionMembershipStatus::Unverified],
    'unverified to suspended' => ['unverified', InstitutionMembershipStatus::Suspended],
    'pending to pending' => ['pending', InstitutionMembershipStatus::Pending],
    'pending to suspended' => ['pending', InstitutionMembershipStatus::Suspended],
    'verified to unverified' => ['verifiedByApprovedDomain', InstitutionMembershipStatus::Unverified],
    'verified to pending' => ['verifiedByApprovedDomain', InstitutionMembershipStatus::Pending],
    'verified to verified' => ['verifiedByApprovedDomain', InstitutionMembershipStatus::Verified],
    'suspended to unverified' => ['suspended', InstitutionMembershipStatus::Unverified],
    'suspended to pending' => ['suspended', InstitutionMembershipStatus::Pending],
    'suspended to suspended' => ['suspended', InstitutionMembershipStatus::Suspended],
]);

test('verification and review transitions reject incoherent context', function (
    string $factoryState,
    InstitutionMembershipStatus $targetStatus,
    ?InstitutionMembershipVerificationMethod $verificationMethod,
    bool $withReviewer,
) {
    $membership = InstitutionMembership::factory()->{$factoryState}()->create();
    $reviewer = $withReviewer ? User::factory()->create() : null;

    expect(fn () => app(TransitionInstitutionMembership::class)->handle(
        $membership,
        $targetStatus,
        $verificationMethod,
        $reviewer,
    ))->toThrow(InvalidInstitutionMembershipTransition::class);
})->with([
    'verification without method' => [
        'unverified',
        InstitutionMembershipStatus::Verified,
        null,
        false,
    ],
    'domain verification with reviewer' => [
        'unverified',
        InstitutionMembershipStatus::Verified,
        InstitutionMembershipVerificationMethod::ApprovedDomain,
        true,
    ],
    'campus verification without reviewer' => [
        'pending',
        InstitutionMembershipStatus::Verified,
        InstitutionMembershipVerificationMethod::CampusAdminReview,
        false,
    ],
    'rejection without reviewer' => [
        'pending',
        InstitutionMembershipStatus::Unverified,
        null,
        false,
    ],
    'pending request with reviewer' => [
        'unverified',
        InstitutionMembershipStatus::Pending,
        null,
        true,
    ],
]);

test('suspension rejects a verified status without verification provenance', function () {
    $membership = InstitutionMembership::factory()->create([
        'status' => InstitutionMembershipStatus::Verified,
        'verified_at' => null,
        'verification_method' => null,
    ]);

    expect(fn () => app(TransitionInstitutionMembership::class)->handle(
        $membership,
        InstitutionMembershipStatus::Suspended,
    ))->toThrow(InvalidInstitutionMembershipTransition::class);
});
