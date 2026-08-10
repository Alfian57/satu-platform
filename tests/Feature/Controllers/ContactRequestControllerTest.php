<?php

declare(strict_types=1);

use App\Actions\Recruiter\GrantRecruiterEntitlement;
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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('renders recruiter contact requests index page', function () {
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

    RecruiterContactRequest::factory()->create([
        'recruiter_organization_id' => $org->id,
        'recruiter_user_id' => $recruiter->id,
        'talent_candidate_projection_id' => $candidate->id,
        'candidate_user_id' => $studentUser->id,
        'purpose' => 'Engineering Discussion',
    ]);

    $response = $this->actingAs($recruiter)
        ->get(route('recruiter.talent.contact-requests.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('talent/contact-requests')
        ->has('requests', 1)
        ->where('requests.0.purpose', 'Engineering Discussion')
    );
});

it('allows recruiter to store contact request via POST endpoint', function () {
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

    $response = $this->actingAs($recruiter)
        ->post(route('recruiter.talent.candidates.contact', ['id' => $candidate->id]), [
            'purpose' => 'Project Opportunity',
            'message' => 'We would love to discuss a project role with you.',
        ]);

    $response->assertRedirect();
    expect(RecruiterContactRequest::query()->where('purpose', 'Project Opportunity')->exists())->toBeTrue();
});

it('allows student to view, accept, and decline contact requests', function () {
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

    $contactReq = RecruiterContactRequest::factory()->create([
        'recruiter_organization_id' => $org->id,
        'recruiter_user_id' => $recruiter->id,
        'talent_candidate_projection_id' => $candidate->id,
        'candidate_user_id' => $studentUser->id,
        'purpose' => 'System Design Project',
        'status' => ContactRequestStatus::Pending,
    ]);

    // Student views index
    $responseIndex = $this->actingAs($studentUser)
        ->get(route('student.contact-requests.index'));

    $responseIndex->assertStatus(200);
    $responseIndex->assertInertia(fn (Assert $page) => $page
        ->component('student/contact-requests')
        ->has('requests', 1)
        ->where('requests.0.purpose', 'System Design Project')
    );

    // Student accepts request
    $responseAccept = $this->actingAs($studentUser)
        ->post(route('student.contact-requests.accept', ['id' => $contactReq->id]));

    $responseAccept->assertRedirect();
    expect($contactReq->fresh()->status)->toBe(ContactRequestStatus::Accepted);
});
