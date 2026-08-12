<?php

use App\Enums\MatchingDimension;
use App\Enums\RecommendationFeedbackType;
use App\Models\AvailabilityWindow;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\MatchRun;
use App\Models\MatchScoreVersion;
use App\Models\ProfileSkill;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\Recommendation;
use App\Models\RecommendationFeedback;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * @return array{candidate: User, owner: User, institution: Institution, profile: StudentProfile, recommendation: Recommendation}
 */
function dashboardRecommendationContext(): array
{
    $institution = Institution::factory()->active()->create();
    $candidate = User::factory()->create();
    $owner = User::factory()->create();

    foreach ([$candidate, $owner] as $user) {
        InstitutionMembership::factory()
            ->student()
            ->verifiedByApprovedDomain()
            ->for($user)
            ->for($institution)
            ->create();
    }

    $profile = StudentProfile::factory()
        ->for($candidate)
        ->for($institution)
        ->create();
    $skill = SkillTaxonomy::factory()->create(['name' => 'Riset pengguna']);
    ProfileSkill::factory()
        ->for($profile, 'studentProfile')
        ->for($skill, 'taxonomy')
        ->create([
            'proficiency' => 'advanced',
        ]);
    AvailabilityWindow::factory()->for($profile, 'studentProfile')->create();

    $version = MatchScoreVersion::factory()->version('1.0.0')->create();
    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create(['title' => 'Project Rekomendasi Dashboard']);
    ProjectRole::factory()->for($project)->create(['title' => 'Product Researcher']);
    $run = MatchRun::factory()
        ->for($institution)
        ->for($candidate, 'actor')
        ->for($project)
        ->for($version, 'version')
        ->create([
            'institution_id' => $institution->getKey(),
            'actor_id' => $candidate->getKey(),
            'project_id' => $project->getKey(),
            'version_id' => $version->getKey(),
        ]);
    $recommendation = Recommendation::factory()
        ->for($run, 'matchRun')
        ->for($institution)
        ->for($project)
        ->for($candidate, 'candidate')
        ->create([
            'match_run_id' => $run->getKey(),
            'institution_id' => $institution->getKey(),
            'project_id' => $project->getKey(),
            'candidate_id' => $candidate->getKey(),
            'component_scores' => [
                MatchingDimension::SkillFit->value => 0.8,
                MatchingDimension::ProjectNeed->value => 0.9,
                MatchingDimension::Availability->value => 0.7,
                MatchingDimension::ConnectivityOpportunity->value => 0.95,
            ],
            'reason_candidates' => [
                [
                    'dimension' => MatchingDimension::ProjectNeed->value,
                    'score' => 0.9,
                    'type' => 'positive',
                    'reason' => 'Kebutuhan project cocok dengan profilmu.',
                ],
                [
                    'dimension' => MatchingDimension::SkillFit->value,
                    'score' => 0.8,
                    'type' => 'positive',
                    'reason' => 'Skill riset pengguna dibutuhkan tim.',
                ],
                [
                    'dimension' => MatchingDimension::Availability->value,
                    'score' => 0.7,
                    'type' => 'positive',
                    'reason' => 'Ketersediaanmu sesuai kebutuhan project.',
                ],
                [
                    'dimension' => MatchingDimension::ConnectivityOpportunity->value,
                    'score' => 0.95,
                    'type' => 'positive',
                    'reason' => 'Internal detail tidak boleh diproyeksikan.',
                ],
            ],
        ]);

    return compact('candidate', 'owner', 'institution', 'profile', 'recommendation');
}

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))
        ->assertRedirect(route('login'));
});

test('dashboard starts with a server-authoritative affiliation action', function () {
    $user = User::factory()->create();

    $this->withoutVite()
        ->actingAs($user)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('dashboard')
                ->where('institution', null)
                ->where('profileReadiness.state', 'unavailable')
                ->where('nextAction.reference', 'AFF-START')
                ->where('nextAction.primaryAction.key', 'onboarding')
                ->where('reviewQueue.state', 'unavailable'),
        );
});

test('pending affiliation explains the boundary without inventing protected work', function () {
    $user = User::factory()->create();
    $institution = Institution::factory()->active()->create();
    InstitutionMembership::factory()
        ->student()
        ->pending()
        ->for($user)
        ->for($institution)
        ->create();

    $this->withoutVite()
        ->actingAs($user)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('institution.id', $institution->getKey())
                ->where('nextAction.statusLabel', 'Menunggu tinjauan')
                ->where('nextAction.primaryAction.key', 'onboarding')
                ->where('dashboardNotice.tone', 'pending')
                ->where('profileReadiness.state', 'unavailable')
                ->loadDeferredProps(
                    fn (Assert $reload) => $reload
                        ->where('activeProjects.state', 'forbidden')
                        ->where('recommendations.state', 'forbidden')
                        ->missing('recommendations.recommendation'),
                ),
        );
});

test('unverified affiliation keeps the dashboard at the verification boundary', function () {
    $institution = Institution::factory()->active()->create();
    $user = User::factory()->create();
    $membership = InstitutionMembership::factory()
        ->for($user)
        ->for($institution)
        ->create();

    $this->withoutVite()
        ->actingAs($user)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('profileReadiness.state', 'unavailable')
                ->where('nextAction.reference', 'AFF-'.$membership->getKey())
                ->where('nextAction.statusLabel', 'Perlu diverifikasi')
                ->loadDeferredProps(
                    fn (Assert $reload) => $reload
                        ->where('recommendations.state', 'forbidden')
                        ->where('activeProjects.state', 'forbidden'),
                ),
        );
});

test('dashboard uses actual profile, project recommendation, and safe reasons', function () {
    $context = dashboardRecommendationContext();

    $this->withoutVite()
        ->actingAs($context['candidate'])
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('dashboard')
                ->where('institution.id', $context['institution']->getKey())
                ->where('profileReadiness.state', 'ready')
                ->where('nextAction.category', 'Recommendation project')
                ->where('nextAction.primaryAction.projectId', $context['recommendation']->project_id)
                ->loadDeferredProps(
                    fn (Assert $reload) => $reload
                        ->where('recommendations.state', 'ready')
                        ->where('recommendations.recommendation.id', $context['recommendation']->getKey())
                        ->where('recommendations.recommendation.title', 'Project Rekomendasi Dashboard')
                        ->where('recommendations.recommendation.role', 'Product Researcher')
                        ->where('recommendations.recommendation.reasons.0', 'Kebutuhan project cocok dengan profilmu.')
                        ->missing('recommendations.recommendation.connectivityOpportunity')
                        ->where('activeProjects.state', 'empty'),
                ),
        );
});

test('active projects are tenant-scoped and only show projects owned by the student', function () {
    $context = dashboardRecommendationContext();
    $owned = Project::factory()
        ->open()
        ->for($context['institution'])
        ->for($context['candidate'], 'owner')
        ->create(['title' => 'Project Milik Student']);
    $foreignInstitution = Institution::factory()->active()->create();
    Project::factory()
        ->open()
        ->for($foreignInstitution)
        ->for($context['candidate'], 'owner')
        ->create(['title' => 'Project Tenant Lain']);

    $this->withoutVite()
        ->actingAs($context['candidate'])
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page->loadDeferredProps(
                fn (Assert $reload) => $reload
                    ->where('activeProjects.state', 'ready')
                    ->where('activeProjects.totalCount', 1)
                    ->where('activeProjects.projects.0.id', $owned->getKey())
                    ->where('activeProjects.projects.0.name', 'Project Milik Student')
                    ->missing('activeProjects.projects.1'),
            ),
        );
});

test('dashboard feedback routes record only the current student outcome', function () {
    $context = dashboardRecommendationContext();

    $this->withoutVite()
        ->actingAs($context['candidate'])
        ->from(route('dashboard'))
        ->post(route('dashboard.recommendations.hide', $context['recommendation']))
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('dashboard_feedback', 'hidden');

    expect(RecommendationFeedback::query()
        ->where('recommendation_id', $context['recommendation']->getKey())
        ->where('actor_id', $context['candidate']->getKey())
        ->value('feedback_type'))->toBe(RecommendationFeedbackType::Hidden);
});

test('dashboard feedback route denies a recommendation from another tenant', function () {
    $context = dashboardRecommendationContext();
    $foreignInstitution = Institution::factory()->active()->create();
    $foreignCandidate = User::factory()->create();
    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($foreignCandidate)
        ->for($foreignInstitution)
        ->create();

    $this->actingAs($foreignCandidate)
        ->post(route('dashboard.recommendations.not-relevant', $context['recommendation']))
        ->assertForbidden();

    expect(RecommendationFeedback::query()->count())->toBe(0);
});

test('dashboard query budget stays bounded as active projects and recommendations grow', function () {
    $context = dashboardRecommendationContext();

    collect(range(1, 3))->each(function (int $number) use ($context): void {
        $project = Project::factory()
            ->open()
            ->for($context['institution'])
            ->for($context['candidate'], 'owner')
            ->create([
                'title' => 'Project baseline '.$number,
                'deadline' => now()->addDays($number),
            ]);

        $run = MatchRun::factory()
            ->for($context['institution'])
            ->for($context['candidate'], 'actor')
            ->for($project)
            ->for(MatchScoreVersion::current(), 'version')
            ->create([
                'institution_id' => $context['institution']->getKey(),
                'actor_id' => $context['candidate']->getKey(),
                'project_id' => $project->getKey(),
                'version_id' => MatchScoreVersion::current()->getKey(),
            ]);

        Recommendation::factory()
            ->for($run, 'matchRun')
            ->for($context['institution'])
            ->for($project)
            ->for($context['candidate'], 'candidate')
            ->create([
                'match_run_id' => $run->getKey(),
                'institution_id' => $context['institution']->getKey(),
                'project_id' => $project->getKey(),
                'candidate_id' => $context['candidate']->getKey(),
                'component_scores' => [
                    MatchingDimension::SkillFit->value => 0.8,
                    MatchingDimension::ProjectNeed->value => 0.9,
                    MatchingDimension::Availability->value => 0.7,
                    MatchingDimension::ConnectivityOpportunity->value => 0.95,
                ],
                'reason_candidates' => [[
                    'dimension' => MatchingDimension::ProjectNeed->value,
                    'score' => 0.9,
                    'type' => 'positive',
                    'reason' => 'Baseline recommendation '.$number,
                ]],
            ]);
    });

    $baseline = measureDatabaseQueries(function () use ($context): void {
        $this->withoutVite()
            ->actingAs($context['candidate'])
            ->get(route('dashboard'))
            ->assertSuccessful();
    });

    collect(range(4, 27))->each(function (int $number) use ($context): void {
        $project = Project::factory()
            ->open()
            ->for($context['institution'])
            ->for($context['candidate'], 'owner')
            ->create([
                'title' => 'Project volume '.$number,
                'deadline' => now()->addDays($number),
            ]);

        $run = MatchRun::factory()
            ->for($context['institution'])
            ->for($context['candidate'], 'actor')
            ->for($project)
            ->for(MatchScoreVersion::current(), 'version')
            ->create([
                'institution_id' => $context['institution']->getKey(),
                'actor_id' => $context['candidate']->getKey(),
                'project_id' => $project->getKey(),
                'version_id' => MatchScoreVersion::current()->getKey(),
            ]);

        Recommendation::factory()
            ->for($run, 'matchRun')
            ->for($context['institution'])
            ->for($project)
            ->for($context['candidate'], 'candidate')
            ->create([
                'match_run_id' => $run->getKey(),
                'institution_id' => $context['institution']->getKey(),
                'project_id' => $project->getKey(),
                'candidate_id' => $context['candidate']->getKey(),
                'component_scores' => [
                    MatchingDimension::SkillFit->value => 0.8,
                    MatchingDimension::ProjectNeed->value => 0.9,
                    MatchingDimension::Availability->value => 0.7,
                    MatchingDimension::ConnectivityOpportunity->value => 0.95,
                ],
                'reason_candidates' => [[
                    'dimension' => MatchingDimension::ProjectNeed->value,
                    'score' => 0.9,
                    'type' => 'positive',
                    'reason' => 'Volume recommendation '.$number,
                ]],
            ]);
    });

    $expanded = measureDatabaseQueries(function () use ($context): void {
        $this->withoutVite()
            ->actingAs($context['candidate'])
            ->get(route('dashboard'))
            ->assertSuccessful();
    });

    expect($expanded['total'])->toBe($baseline['total']);
});

test('stale dashboard recommendations expose recovery and reject feedback', function () {
    $context = dashboardRecommendationContext();
    MatchScoreVersion::factory()->version('2.0.0')->create();

    $this->withoutVite()
        ->actingAs($context['candidate'])
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('dashboardNotice.tone', 'stale')
                ->where('dashboardNotice.action.key', 'refresh')
                ->loadDeferredProps(
                    fn (Assert $reload) => $reload
                        ->where('recommendations.recommendation.isStale', true),
                ),
        );

    $this->actingAs($context['candidate'])
        ->from(route('dashboard'))
        ->post(route('dashboard.recommendations.not-relevant', $context['recommendation']))
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('dashboard_issue', 'recommendation_stale');

    expect(RecommendationFeedback::query()->count())->toBe(0);
});
