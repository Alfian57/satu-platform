<?php

declare(strict_types=1);

use App\Actions\Recruiter\InviteRecruiterMember;
use App\Actions\Recruiter\RecruiterVerificationQueue;
use App\Actions\Recruiter\SubmitRecruiterVerificationReview;
use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Enums\RecruiterVerificationConclusion;
use App\Models\AuditLog;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\RecruiterVerificationReview;
use App\Models\User;
use App\Support\RecruiterOrganizationSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('denies access to recruiter verification queue for non-platform admins', function () {
    $regularUser = User::factory()->create(['is_platform_admin' => false]);
    $queue = app(RecruiterVerificationQueue::class);

    expect(fn () => $queue->query($regularUser))
        ->toThrow(AuthorizationException::class);
});

it('allows platform admin to query recruiter verification queue and filter by status', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);

    $pendingOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Pending]);
    $verifiedOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    $queue = app(RecruiterVerificationQueue::class);

    $pendingList = $queue->paginate($platformAdmin, 'pending');
    expect($pendingList->total())->toBe(1)
        ->and($pendingList->items()[0]->id)->toBe($pendingOrg->id);

    $verifiedList = $queue->paginate($platformAdmin, 'verified');
    expect($verifiedList->total())->toBe(1)
        ->and($verifiedList->items()[0]->id)->toBe($verifiedOrg->id);
});

it('requires a reason when rejecting or suspending an organization', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Pending]);

    $action = app(SubmitRecruiterVerificationReview::class);

    expect(fn () => $action->execute($platformAdmin, $org, RecruiterVerificationConclusion::Rejected, '   '))
        ->toThrow(InvalidArgumentException::class, 'A reason is required when rejecting or suspending a recruiter organization.');

    expect(fn () => $action->execute($platformAdmin, $org, RecruiterVerificationConclusion::Suspended, null))
        ->toThrow(InvalidArgumentException::class, 'A reason is required when rejecting or suspending a recruiter organization.');
});

it('allows platform admin to approve, reject, suspend, and unsuspend an organization with audit log', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Pending]);

    $action = app(SubmitRecruiterVerificationReview::class);

    // 1. Approve (Verified)
    $reviewVerified = $action->execute(
        admin: $platformAdmin,
        organization: $org,
        conclusion: RecruiterVerificationConclusion::Verified,
        reason: 'Business license and website domain verified.',
    );

    expect($org->fresh()->status)->toBe(RecruiterOrganizationStatus::Verified)
        ->and($reviewVerified->conclusion)->toBe(RecruiterVerificationConclusion::Verified)
        ->and($reviewVerified->reviewer_id)->toBe($platformAdmin->id);

    $auditVerified = AuditLog::where('operation', 'recruiter_organization.reviewed')->first();
    expect($auditVerified)->not->toBeNull()
        ->and($auditVerified->actor_id)->toBe($platformAdmin->id);

    // 2. Suspend
    $reviewSuspend = $action->execute(
        admin: $platformAdmin,
        organization: $org->fresh(),
        conclusion: RecruiterVerificationConclusion::Suspended,
        reason: 'Violation of platform terms detected.',
    );

    expect($org->fresh()->status)->toBe(RecruiterOrganizationStatus::Suspended)
        ->and($reviewSuspend->conclusion)->toBe(RecruiterVerificationConclusion::Suspended);

    // 3. Unsuspend
    $reviewUnsuspend = $action->execute(
        admin: $platformAdmin,
        organization: $org->fresh(),
        conclusion: RecruiterVerificationConclusion::Unsuspend,
        reason: 'Compliance issues resolved after appeal.',
    );

    expect($org->fresh()->status)->toBe(RecruiterOrganizationStatus::Verified)
        ->and($reviewUnsuspend->conclusion)->toBe(RecruiterVerificationConclusion::Unsuspend);
});

it('enforces append-only constraints on recruiter verification reviews', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Pending]);

    $action = app(SubmitRecruiterVerificationReview::class);
    $review = $action->execute(
        admin: $platformAdmin,
        organization: $org,
        conclusion: RecruiterVerificationConclusion::Verified,
        reason: 'Verified.',
    );

    expect(fn () => $review->delete())
        ->toThrow(LogicException::class, 'Recruiter verification reviews are append-only.');
});

it('allows verified organization admins to invite recruiter members', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $orgOwner = User::factory()->create();
    $invitee = User::factory()->create();

    $pendingOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Pending]);
    $verifiedOrg = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $verifiedOrg->id,
        'user_id' => $orgOwner->id,
        'role' => RecruiterMembershipRole::Owner,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    $inviteAction = app(InviteRecruiterMember::class);

    // Pending org cannot invite
    expect(fn () => $inviteAction->execute($platformAdmin, $pendingOrg, $invitee))
        ->toThrow(InvalidArgumentException::class, 'Only verified recruiter organizations can invite members.');

    // Owner inviting member to verified org
    $membership = $inviteAction->execute($orgOwner, $verifiedOrg, $invitee, RecruiterMembershipRole::Recruiter);

    expect($membership->recruiter_organization_id)->toBe($verifiedOrg->id)
        ->and($membership->user_id)->toBe($invitee->id)
        ->and($membership->role)->toBe(RecruiterMembershipRole::Recruiter)
        ->and($membership->status)->toBe(RecruiterMembershipStatus::Pending);

    // Duplicate invite fails
    expect(fn () => $inviteAction->execute($orgOwner, $verifiedOrg, $invitee))
        ->toThrow(InvalidArgumentException::class, 'User is already a member of this recruiter organization.');
});

it('serializes recruiter organizations safely via projection allowlist', function () {
    $org = RecruiterOrganization::factory()->create([
        'name' => 'Acme Talent Corp',
        'industry' => 'Technology',
        'website' => 'https://acme.example.com',
        'status' => RecruiterOrganizationStatus::Verified,
        'evidence_metadata' => [
            'document_type' => 'SIUP',
            'business_license_number_masked' => '1234-****-90',
            'verification_notes' => 'Verified by admin',
            'unallowlisted_secret' => 'super_secret',
        ],
    ]);

    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    RecruiterVerificationReview::factory()->create([
        'recruiter_organization_id' => $org->id,
        'reviewer_id' => $platformAdmin->id,
        'conclusion' => RecruiterVerificationConclusion::Verified,
        'reason' => 'Approved.',
    ]);

    $serializer = new RecruiterOrganizationSerializer;
    $serialized = $serializer->toArray($org);

    expect($serialized)->toHaveKeys([
        'id',
        'name',
        'industry',
        'website',
        'status',
        'evidence_metadata',
        'created_at',
        'reviews',
    ])
        ->and($serialized['evidence_metadata'])->not->toHaveKey('unallowlisted_secret');
});
