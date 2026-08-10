<?php

declare(strict_types=1);

use App\Actions\Recruiter\GrantRecruiterEntitlement;
use App\Actions\Talent\FetchSavedCandidates;
use App\Actions\Talent\SaveCandidate;
use App\Actions\Talent\UnsaveCandidate;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\Institution;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterSavedCandidate;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('allows entitled recruiter to save candidate idempotently', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);
    $institution = Institution::factory()->active()->create();

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    app(GrantRecruiterEntitlement::class)->execute(
        issuer: $platformAdmin,
        organization: $org,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
        endsAt: Carbon::now()->addMonth(),
    );

    $candidate = TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $saveAction = app(SaveCandidate::class);

    // First save call
    $saved1 = $saveAction->execute($recruiter, $org, $candidate->id);
    expect($saved1)->toBeInstanceOf(RecruiterSavedCandidate::class)
        ->and($saved1->talent_candidate_projection_id)->toBe($candidate->id);

    // Second save call (idempotent)
    $saved2 = $saveAction->execute($recruiter, $org, $candidate->id);
    expect($saved2->id)->toBe($saved1->id);

    expect(RecruiterSavedCandidate::query()->count())->toBe(1);
});

it('denies candidate save for non-member recruiter', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $nonMemberRecruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);
    $institution = Institution::factory()->active()->create();

    app(GrantRecruiterEntitlement::class)->execute(
        issuer: $platformAdmin,
        organization: $org,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
    );

    $candidate = TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $saveAction = app(SaveCandidate::class);

    expect(fn () => $saveAction->execute($nonMemberRecruiter, $org, $candidate->id))
        ->toThrow(AuthorizationException::class, 'You are not an active member of this recruiter organization.');
});

it('denies candidate save for recruiter organization without active entitlement', function () {
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);
    $institution = Institution::factory()->active()->create();

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    $candidate = TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $saveAction = app(SaveCandidate::class);

    expect(fn () => $saveAction->execute($recruiter, $org, $candidate->id))
        ->toThrow(AuthorizationException::class, 'Recruiter organization does not hold an active candidate search entitlement.');
});

it('denies candidate save for withdrawn or non-existent candidate', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);
    $institution = Institution::factory()->active()->create();

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    app(GrantRecruiterEntitlement::class)->execute(
        issuer: $platformAdmin,
        organization: $org,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
    );

    $withdrawnCandidate = TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'is_visible' => false,
    ]);

    $saveAction = app(SaveCandidate::class);

    expect(fn () => $saveAction->execute($recruiter, $org, $withdrawnCandidate->id))
        ->toThrow(InvalidArgumentException::class, 'Target candidate projection is not found or has been withdrawn.');
});

it('allows entitled recruiter to unsave candidate idempotently', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);
    $institution = Institution::factory()->active()->create();

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    app(GrantRecruiterEntitlement::class)->execute(
        issuer: $platformAdmin,
        organization: $org,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
    );

    $candidate = TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $saveAction = app(SaveCandidate::class);
    $unsaveAction = app(UnsaveCandidate::class);

    $saveAction->execute($recruiter, $org, $candidate->id);
    expect(RecruiterSavedCandidate::query()->count())->toBe(1);

    // Unsave first call
    $result1 = $unsaveAction->execute($recruiter, $org, $candidate->id);
    expect($result1)->toBeTrue()
        ->and(RecruiterSavedCandidate::query()->count())->toBe(0);

    // Unsave second call (idempotent)
    $result2 = $unsaveAction->execute($recruiter, $org, $candidate->id);
    expect($result2)->toBeTrue();
});

it('excludes withdrawn candidates from saved list query', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);
    $institution = Institution::factory()->active()->create();

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    app(GrantRecruiterEntitlement::class)->execute(
        issuer: $platformAdmin,
        organization: $org,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subHour(),
    );

    $visibleCandidate = TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $withdrawnCandidate = TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $saveAction = app(SaveCandidate::class);
    $saveAction->execute($recruiter, $org, $visibleCandidate->id);
    $saveAction->execute($recruiter, $org, $withdrawnCandidate->id);

    // Candidate withdraws projection
    $withdrawnCandidate->update(['is_visible' => false]);

    $fetchAction = app(FetchSavedCandidates::class);
    $savedResults = $fetchAction->execute($recruiter, $org);

    expect($savedResults->total())->toBe(1)
        ->and($savedResults->items()[0]['id'])->toBe($visibleCandidate->id);
});
