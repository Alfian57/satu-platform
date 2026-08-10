<?php

declare(strict_types=1);

use App\Actions\Recruiter\GrantRecruiterEntitlement;
use App\Actions\Talent\SearchTalentCandidates;
use App\Actions\Talent\UpdateTalentCandidateProjection;
use App\Enums\RecruiterEntitlementScope;
use App\Enums\RecruiterMembershipRole;
use App\Enums\RecruiterMembershipStatus;
use App\Enums\RecruiterOrganizationStatus;
use App\Models\Institution;
use App\Models\RecruiterMembership;
use App\Models\RecruiterOrganization;
use App\Models\TalentCandidateProjection;
use App\Models\User;
use App\Support\RecruiterSafeCandidateSerializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('denies talent search for recruiter organization without active entitlement', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    $searchAction = app(SearchTalentCandidates::class);

    expect(fn () => $searchAction->execute($recruiter, $org))
        ->toThrow(AuthorizationException::class, 'Recruiter organization does not hold an active candidate search entitlement.');
});

it('denies talent search for recruiter organization with expired entitlement', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    // Grant entitlement that expired yesterday
    app(GrantRecruiterEntitlement::class)->execute(
        issuer: $platformAdmin,
        organization: $org,
        scope: RecruiterEntitlementScope::CandidateSearch,
        startsAt: Carbon::now()->subDays(10),
        endsAt: Carbon::now()->subDay(),
    );

    $searchAction = app(SearchTalentCandidates::class);

    expect(fn () => $searchAction->execute($recruiter, $org))
        ->toThrow(AuthorizationException::class, 'Recruiter organization does not hold an active candidate search entitlement.');
});

it('allows entitled recruiter to search and filter candidates deterministically', function () {
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

    $candidate1 = User::factory()->create();
    $candidate2 = User::factory()->create();

    $updateAction = app(UpdateTalentCandidateProjection::class);
    $updateAction->execute($candidate1, $candidate1, $institution, [
        'headline' => 'Senior Laravel Engineer',
        'skills' => ['PHP', 'Laravel', 'Vue.js'],
        'badges' => ['Top Contributor'],
        'availability_status' => 'available',
        'is_visible' => true,
    ]);

    $updateAction->execute($candidate2, $candidate2, $institution, [
        'headline' => 'Python Data Scientist',
        'skills' => ['Python', 'Pandas'],
        'badges' => ['AI Researcher'],
        'availability_status' => 'not_available',
        'is_visible' => true,
    ]);

    $searchAction = app(SearchTalentCandidates::class);

    // Search by skill 'Laravel'
    $resultsSkill = $searchAction->execute($recruiter, $org, skills: ['Laravel']);
    expect($resultsSkill->total())->toBe(1)
        ->and($resultsSkill->items()[0]['headline'])->toBe('Senior Laravel Engineer');

    // Search by availability 'available'
    $resultsAvail = $searchAction->execute($recruiter, $org, availabilityStatus: 'available');
    expect($resultsAvail->total())->toBe(1)
        ->and($resultsAvail->items()[0]['headline'])->toBe('Senior Laravel Engineer');
});

it('excludes withdrawn / hidden projections from search results', function () {
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
        startsAt: Carbon::now(),
    );

    $candidate = User::factory()->create();

    $updateAction = app(UpdateTalentCandidateProjection::class);
    $updateAction->execute($candidate, $candidate, $institution, [
        'headline' => 'Fullstack Developer',
        'is_visible' => false, // Hidden / withdrawn projection
    ]);

    $searchAction = app(SearchTalentCandidates::class);
    $results = $searchAction->execute($recruiter, $org);

    expect($results->total())->toBe(0);
});

it('enforces strict negative serialization guaranteeing no sensitive data leaks', function () {
    $institution = Institution::factory()->active()->create();
    $student = User::factory()->create([
        'name' => 'John Student',
        'username' => 'johnstudent',
    ]);

    $projection = TalentCandidateProjection::factory()->create([
        'user_id' => $student->id,
        'institution_id' => $institution->id,
        'headline' => 'Software Engineer Candidate',
        'bio' => 'Passionate about secure software.',
        'skills' => ['Rust', 'Cybersecurity'],
        'badges' => ['Certified Security Associate'],
        'contributions' => ['Open Source Security Audit'],
        'availability_status' => 'available',
        'is_visible' => true,
    ]);

    $serializer = new RecruiterSafeCandidateSerializer;
    $serialized = $serializer->toArray($projection);

    // Negative assertions verifying privacy boundary
    $forbiddenFields = [
        'username',
        'nim',
        'phone',
        'email',
        'password',
        'inclusion',
        'inclusion_signals',
        'inclusion_reviews',
        'private_evidence',
        'message',
        'messages',
        'raw_audit',
        'raw_audit_logs',
        'hidden_matching_input',
        'hidden_matching_inputs',
    ];

    foreach ($forbiddenFields as $forbiddenKey) {
        expect($serialized)->not->toHaveKey($forbiddenKey);
    }

    // Positive assertions for allowlisted fields
    expect($serialized)->toHaveKeys([
        'id',
        'headline',
        'bio',
        'skills',
        'badges',
        'contributions',
        'availability_status',
        'verified_at',
        'institution_name',
    ])
        ->and($serialized['headline'])->toBe('Software Engineer Candidate')
        ->and($serialized['institution_name'])->toBe($institution->name);
});
