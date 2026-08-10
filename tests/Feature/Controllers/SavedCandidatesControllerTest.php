<?php

declare(strict_types=1);

use App\Actions\Recruiter\GrantRecruiterEntitlement;
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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('renders saved candidates index page for entitled recruiter', function () {
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
        'headline' => 'Saved Staff Engineer',
        'is_visible' => true,
    ]);

    RecruiterSavedCandidate::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'talent_candidate_projection_id' => $candidate->id,
    ]);

    $response = $this->actingAs($recruiter)
        ->get(route('recruiter.talent.saved'));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('talent/saved')
        ->has('candidates.data', 1)
        ->where('candidates.data.0.headline', 'Saved Staff Engineer')
        ->where('entitlement.has_entitlement', true)
    );
});

it('saves candidate projection via POST request', function () {
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

    $response = $this->actingAs($recruiter)
        ->post(route('recruiter.talent.candidates.save', ['id' => $candidate->id]));

    $response->assertRedirect();
    expect(RecruiterSavedCandidate::query()->where('talent_candidate_projection_id', $candidate->id)->exists())->toBeTrue();
});

it('unsaves candidate projection via DELETE request', function () {
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

    RecruiterSavedCandidate::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'talent_candidate_projection_id' => $candidate->id,
    ]);

    $response = $this->actingAs($recruiter)
        ->delete(route('recruiter.talent.candidates.unsave', ['id' => $candidate->id]));

    $response->assertRedirect();
    expect(RecruiterSavedCandidate::query()->where('talent_candidate_projection_id', $candidate->id)->exists())->toBeFalse();
});
