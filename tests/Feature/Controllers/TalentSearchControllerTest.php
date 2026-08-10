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
use App\Models\TalentCandidateProjection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('renders talent search page for entitled recruiter with URL filters', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

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

    $institution = Institution::factory()->active()->create();
    TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'headline' => 'Lead PHP Engineer',
        'skills' => ['PHP', 'Laravel'],
        'is_visible' => true,
    ]);

    $response = $this->actingAs($recruiter)
        ->get(route('recruiter.talent.search', ['query' => 'PHP', 'skills' => 'Laravel']));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('talent/search')
        ->has('candidates.data', 1)
        ->where('filters.query', 'PHP')
        ->where('filters.skills', ['Laravel'])
        ->where('entitlement.has_entitlement', true)
    );
});

it('renders talent search page with entitlement warning banner when entitlement is missing', function () {
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $org->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    $response = $this->actingAs($recruiter)
        ->get(route('recruiter.talent.search'));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('talent/search')
        ->where('candidates.total', 0)
        ->where('entitlement.has_entitlement', false)
        ->where('entitlement.status', 'missing')
    );
});

it('renders candidate detail page with provenance and contact consequence notice', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);
    $institution = Institution::factory()->active()->create(['name' => 'Institut Teknologi SATU']);

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
        'headline' => 'Senior Systems Architect',
        'is_visible' => true,
    ]);

    $response = $this->actingAs($recruiter)
        ->get(route('recruiter.talent.candidates.show', ['id' => $candidate->id]));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('talent/candidate-detail')
        ->where('candidate.headline', 'Senior Systems Architect')
        ->where('candidate.institution_name', 'Institut Teknologi SATU')
        ->where('contactConsequenceNotice', 'Nomor telepon dan kontak langsung hanya terbuka setelah kandidat menyetujui permintaan kontak.')
    );
});

it('returns 404 for non-existent or hidden candidate projection', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $recruiter = User::factory()->create();
    $org = RecruiterOrganization::factory()->create(['status' => RecruiterOrganizationStatus::Verified]);

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

    $hiddenCandidate = TalentCandidateProjection::factory()->create([
        'is_visible' => false,
    ]);

    $response = $this->actingAs($recruiter)
        ->get(route('recruiter.talent.candidates.show', ['id' => $hiddenCandidate->id]));

    $response->assertStatus(404);
});
