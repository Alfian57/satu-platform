<?php

declare(strict_types=1);

use App\Actions\Recruiter\GrantRecruiterEntitlement;
use App\Actions\Recruiter\RevokeRecruiterEntitlement;
use App\Actions\Recruiter\VerifyRecruiterEntitlement;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterEntitlementStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\AuditLog;
use App\Models\RecruiterEntitlementLog;
use App\Models\RecruiterOrganization;
use App\Models\User;
use App\Support\RecruiterEntitlementSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('denies granting entitlement to non-verified recruiter organization', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $pendingOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Pending]);

    $grantAction = app(GrantRecruiterEntitlement::class);

    expect(fn () => $grantAction->execute(
        issuer: $platformAdmin,
        organization: $pendingOrg,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now(),
    ))->toThrow(InvalidArgumentException::class, 'Entitlements can only be granted to verified recruiter organizations.');
});

it('denies granting entitlement if actor is not platform admin', function () {
    $regularUser = User::factory()->create(['is_platform_admin' => false]);
    $verifiedOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    $grantAction = app(GrantRecruiterEntitlement::class);

    expect(fn () => $grantAction->execute(
        issuer: $regularUser,
        organization: $verifiedOrg,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now(),
    ))->toThrow(AuthorizationException::class, 'Only platform administrators can grant recruiter entitlements.');
});

it('denies granting entitlement if ends_at is before starts_at', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $verifiedOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    $grantAction = app(GrantRecruiterEntitlement::class);

    expect(fn () => $grantAction->execute(
        issuer: $platformAdmin,
        organization: $verifiedOrg,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now(),
        endsAt: Carbon::now()->subDays(1),
    ))->toThrow(InvalidArgumentException::class, 'Entitlement end date must be after the start date.');
});

it('grants entitlement successfully with audit log and append-only entitlement log', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $verifiedOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    $grantAction = app(GrantRecruiterEntitlement::class);
    $startsAt = Carbon::now();
    $endsAt = Carbon::now()->addDays(30);

    $entitlement = $grantAction->execute(
        issuer: $platformAdmin,
        organization: $verifiedOrg,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: $startsAt,
        endsAt: $endsAt,
        reason: 'Enterprise partner trial grant.',
    );

    expect($entitlement->recruiter_organization_id)->toBe($verifiedOrg->id)
        ->and($entitlement->scope)->toBe(RecruiterEntitlementScope::CandidateSearch)
        ->and($entitlement->status)->toBe(RecruiterEntitlementStatus::Active)
        ->and($entitlement->issuer_id)->toBe($platformAdmin->id);

    $log = RecruiterEntitlementLog::where('recruiter_entitlement_id', $entitlement->id)->first();
    expect($log)->not->toBeNull()
        ->and($log->actor_id)->toBe($platformAdmin->id)
        ->and($log->event)->toBe('granted')
        ->and($log->reason)->toBe('Enterprise partner trial grant.');

    $audit = AuditLog::where('operation', 'recruiter_entitlement.granted')->first();
    expect($audit)->not->toBeNull()
        ->and($audit->actor_id)->toBe($platformAdmin->id);
});

it('revokes an entitlement with required reason and logs event', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $verifiedOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    $grantAction = app(GrantRecruiterEntitlement::class);
    $revokeAction = app(RevokeRecruiterEntitlement::class);

    $entitlement = $grantAction->execute(
        issuer: $platformAdmin,
        organization: $verifiedOrg,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now(),
    );

    expect(fn () => $revokeAction->execute($platformAdmin, $entitlement, '   '))
        ->toThrow(InvalidArgumentException::class, 'A reason is required when revoking a recruiter entitlement.');

    $revokedEntitlement = $revokeAction->execute(
        actor: $platformAdmin,
        entitlement: $entitlement,
        reason: 'Policy violation.',
    );

    expect($revokedEntitlement->status)->toBe(RecruiterEntitlementStatus::Revoked);

    $revokeLog = RecruiterEntitlementLog::where('recruiter_entitlement_id', $entitlement->id)
        ->where('event', 'revoked')
        ->first();

    expect($revokeLog)->not->toBeNull()
        ->and($revokeLog->reason)->toBe('Policy violation.');
});

it('verifies entitlement active state accurately across scopes and time boundaries', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $verifiedOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    $grantAction = app(GrantRecruiterEntitlement::class);
    $verifyAction = app(VerifyRecruiterEntitlement::class);

    $now = Carbon::now();

    // 1. Future entitlement -> not active now, expires in 12 days
    $futureEntitlement = $grantAction->execute(
        issuer: $platformAdmin,
        organization: $verifiedOrg,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: $now->copy()->addDays(5),
        endsAt: $now->copy()->addDays(12),
    );

    expect($verifyAction->check($verifiedOrg, RecruiterEntitlementScope::CandidateSearch, $now))->toBeFalse();

    // 2. Active full_suite entitlement -> active now for all scopes
    $grantAction->execute(
        issuer: $platformAdmin,
        organization: $verifiedOrg,
        scope: RecruiterEntitlementScope::FullSuite,
        startsAt: $now->copy()->subDay(),
        endsAt: $now->copy()->addDays(10),
    );

    expect($verifyAction->check($verifiedOrg, RecruiterEntitlementScope::CandidateSearch, $now))->toBeTrue()
        ->and($verifyAction->check($verifiedOrg, RecruiterEntitlementScope::CandidateContact, $now))->toBeTrue()
        ->and($verifyAction->check($verifiedOrg, RecruiterEntitlementScope::JobPosting, $now))->toBeTrue();

    // 3. Check after expiry date -> not active
    $afterExpiry = $now->copy()->addDays(15);
    expect($verifyAction->check($verifiedOrg, RecruiterEntitlementScope::CandidateSearch, $afterExpiry))->toBeFalse();
});

it('enforces append-only constraints on recruiter entitlement logs', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $verifiedOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    $grantAction = app(GrantRecruiterEntitlement::class);
    $entitlement = $grantAction->execute(
        issuer: $platformAdmin,
        organization: $verifiedOrg,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now(),
    );

    $log = RecruiterEntitlementLog::where('recruiter_entitlement_id', $entitlement->id)->first();

    expect(fn () => $log->delete())
        ->toThrow(LogicException::class, 'Recruiter entitlement logs are append-only.');
});

it('serializes recruiter entitlement safely via projection allowlist', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $verifiedOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    $grantAction = app(GrantRecruiterEntitlement::class);
    $entitlement = $grantAction->execute(
        issuer: $platformAdmin,
        organization: $verifiedOrg,
        scope: RecruiterEntitlementScope::FullSuite,
        startsAt: Carbon::now()->subHour(),
        endsAt: Carbon::now()->addMonth(),
        reason: 'Annual enterprise entitlement.',
    );

    $serializer = new RecruiterEntitlementSerializer;
    $serialized = $serializer->toArray($entitlement);

    expect($serialized)->toHaveKeys([
        'id',
        'recruiter_organization_id',
        'scope',
        'status',
        'starts_at',
        'ends_at',
        'issuer_id',
        'issuer_name',
        'reason',
        'is_active',
        'created_at',
        'logs',
    ])
        ->and($serialized['scope'])->toBe('full_suite')
        ->and($serialized['is_active'])->toBeTrue()
        ->and(count($serialized['logs']))->toBe(1);
});
