<?php

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
use Illuminate\Support\Carbon;

test('entitled recruiter can search and view recruiter-safe candidate projections', function () {
    $context = recruiterTalentGateBrowserContext();

    $this->actingAs($context['recruiter']);

    visit(route('recruiter.talent.search'))
        ->resize(390, 844)
        ->waitForText('Talent Search')
        ->assertSee('Verified Safe Projection')
        ->assertSee('Entitlement Active')
        ->assertSee('Senior Laravel Engineer')
        ->assertDontSee('+62812')
        ->assertDontSee('nim')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 't09-recruiter-search-mobile-390x844');

    $page = visit(route('recruiter.talent.search'))
        ->resize(1366, 900)
        ->waitForText('Talent Search')
        ->assertSee('Senior Laravel Engineer')
        ->assertSee('PHP')
        ->assertSee('Universitas Browser Talent')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 't09-recruiter-search-desktop-1366x900');

    $page
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('recruiter without entitlement sees the entitlement required state with no sensitive data', function () {
    $context = recruiterTalentGateBrowserContext(['grant_entitlement' => false]);

    $this->actingAs($context['recruiter']);

    $page = visit(route('recruiter.talent.search'))
        ->resize(1366, 900)
        ->waitForText('Candidate Search Entitlement Required')
        ->assertSee('Talent Entitlement grant')
        ->assertSee('No Candidates Found')
        ->assertDontSee('Senior Laravel Engineer')
        ->assertDontSee('+62812')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 't09-recruiter-search-no-entitlement-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

test('withdrawn candidate projection is absent from recruiter search', function () {
    $context = recruiterTalentGateBrowserContext(['visible' => false]);

    $this->actingAs($context['recruiter']);

    visit(route('recruiter.talent.search'))
        ->resize(390, 844)
        ->waitForText('Talent Search')
        ->assertSee('No Candidates Found')
        ->assertDontSee('Senior Laravel Engineer')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

/**
 * @param  array{grant_entitlement?: bool, visible?: bool}  $overrides
 * @return array{institution: Institution, recruiter: User, candidate: TalentCandidateProjection, organization: RecruiterOrganization}
 */
function recruiterTalentGateBrowserContext(array $overrides = []): array
{
    $grantEntitlement = $overrides['grant_entitlement'] ?? true;
    $visible = $overrides['visible'] ?? true;

    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Browser Talent',
    ]);

    $recruiter = User::factory()->create(['name' => 'Recruiter Browser Talent']);
    $organization = RecruiterOrganization::factory()->create([
        'name' => 'Browser Talent Recruiter',
        'status' => RecruiterOrganizationStatus::Verified,
    ]);

    RecruiterMembership::factory()->create([
        'recruiter_organization_id' => $organization->id,
        'user_id' => $recruiter->id,
        'role' => RecruiterMembershipRole::Recruiter,
        'status' => RecruiterMembershipStatus::Active,
    ]);

    if ($grantEntitlement) {
        $platformAdmin = User::factory()->create(['is_platform_admin' => true]);

        app(GrantRecruiterEntitlement::class)->execute(
            issuer: $platformAdmin,
            organization: $organization,
            scope: RecruiterEntitlementScope::CandidateSearch,
            startsAt: Carbon::now()->subHour(),
            endsAt: Carbon::now()->addMonth(),
        );
    }

    $candidate = TalentCandidateProjection::factory()->create([
        'institution_id' => $institution->id,
        'headline' => 'Senior Laravel Engineer',
        'skills' => ['PHP', 'Laravel'],
        'bio' => 'Building secure recruiting-safe talent projections.',
        'availability_status' => 'available',
        'is_visible' => $visible,
    ]);

    return compact('institution', 'recruiter', 'candidate', 'organization');
}
