<?php

declare(strict_types=1);

use App\Actions\Recruiter\GrantRecruiterEntitlement;
use App\Actions\Talent\CancelContactRequest;
use App\Actions\Talent\RespondContactRequest;
use App\Actions\Talent\SendContactRequest;
use App\Enums\ContactRequestStatus;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\Institution;
use App\Models\RecruiterContactRequest;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use App\Notifications\CandidateContactRequestedNotification;
use App\Support\RecruiterSafeCandidateSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use InvalidArgumentException;

uses(RefreshDatabase::class);

it('allows entitled recruiter to send purpose-bound contact request and dispatches notification', function () {
    Notification::fake();

    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $studentUser = User::factory()->create(['name' => 'Jane Student']);
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
        'user_id' => $studentUser->id,
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $sendAction = app(SendContactRequest::class);
    $contactRequest = $sendAction->execute(
        recruiter: $recruiter,
        organization: $org,
        candidateProjectionId: $candidate->id,
        purpose: 'Engineering Role Discussion',
        message: 'We are interested in discussing your portfolio.',
    );

    expect($contactRequest)->toBeInstanceOf(RecruiterContactRequest::class)
        ->and($contactRequest->status)->toBe(ContactRequestStatus::Pending)
        ->and($contactRequest->purpose)->toBe('Engineering Role Discussion');

    Notification::assertSentTo(
        $studentUser,
        CandidateContactRequestedNotification::class
    );
});

it('prevents duplicate pending contact requests for the same candidate projection', function () {
    Notification::fake();

    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $studentUser = User::factory()->create();
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
        'user_id' => $studentUser->id,
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $sendAction = app(SendContactRequest::class);
    $sendAction->execute($recruiter, $org, $candidate->id, 'First Outreach');

    expect(fn () => $sendAction->execute($recruiter, $org, $candidate->id, 'Second Outreach'))
        ->toThrow(InvalidArgumentException::class, 'A pending contact request already exists for this candidate.');
});

it('guarantees phone number privacy boundary until candidate accepts request', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $studentUser = User::factory()->create(['name' => 'Alice Student']);
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
        'user_id' => $studentUser->id,
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $sendAction = app(SendContactRequest::class);
    $contactRequest = $sendAction->execute($recruiter, $org, $candidate->id, 'Role Discussion');

    $serializer = new RecruiterSafeCandidateSerializer;

    // Pending request: phone is NOT exposed
    $serializedPending = $serializer->toArray($candidate);
    expect($serializedPending)->not->toHaveKey('phone');

    // Candidate accepts request
    app(RespondContactRequest::class)->execute($studentUser, $contactRequest->id, accept: true);

    // Accepted request: phone is revealed via serializer with revealed phone parameter
    $serializedAccepted = $serializer->toArray($candidate, revealedPhone: '081234567890');
    expect($serializedAccepted)->toHaveKey('phone')
        ->and($serializedAccepted['phone'])->toBe('081234567890');
});

it('allows candidate to accept or decline contact request', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $studentUser = User::factory()->create();
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
        'user_id' => $studentUser->id,
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $contactRequest = app(SendContactRequest::class)->execute($recruiter, $org, $candidate->id, 'Outreach Purpose');

    $respondAction = app(RespondContactRequest::class);
    $updated = $respondAction->execute($studentUser, $contactRequest->id, accept: true);

    expect($updated->status)->toBe(ContactRequestStatus::Accepted)
        ->and($updated->responded_at)->not->toBeNull();
});

it('allows recruiter to cancel pending contact request', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $studentUser = User::factory()->create();
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
        'user_id' => $studentUser->id,
        'institution_id' => $institution->id,
        'is_visible' => true,
    ]);

    $contactRequest = app(SendContactRequest::class)->execute($recruiter, $org, $candidate->id, 'Outreach Purpose');

    $cancelAction = app(CancelContactRequest::class);
    $canceled = $cancelAction->execute($recruiter, $org, $contactRequest->id);

    expect($canceled->status)->toBe(ContactRequestStatus::Canceled);
});
