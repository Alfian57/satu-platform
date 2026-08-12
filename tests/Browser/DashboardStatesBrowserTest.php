<?php

use App\Enums\MatchingDimension;
use App\Models\AvailabilityWindow;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\MatchRun;
use App\Models\MatchScoreVersion;
use App\Models\ProfileSkill;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\Recommendation;
use App\Models\SkillTaxonomy;
use App\Models\StudentProfile;
use App\Models\User;

/**
 * @return array{candidate: User, institution: Institution, recommendation: Recommendation}
 */
function dashboardBrowserContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas SATU',
    ]);
    $candidate = User::factory()->create([
        'name' => 'Dian Pratama',
    ]);
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
        ->create(['proficiency' => 'advanced']);
    AvailabilityWindow::factory()->for($profile, 'studentProfile')->create();

    $version = MatchScoreVersion::factory()->version('1.0.0')->create();
    $recommendedProject = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create(['title' => 'Project Recommendation Nyata']);
    ProjectRole::factory()
        ->for($recommendedProject)
        ->create(['title' => 'Product Researcher']);

    $run = MatchRun::factory()
        ->for($institution)
        ->for($candidate, 'actor')
        ->for($recommendedProject)
        ->for($version, 'version')
        ->create([
            'institution_id' => $institution->getKey(),
            'actor_id' => $candidate->getKey(),
            'project_id' => $recommendedProject->getKey(),
            'version_id' => $version->getKey(),
        ]);
    $recommendation = Recommendation::factory()
        ->for($run, 'matchRun')
        ->for($institution)
        ->for($recommendedProject)
        ->for($candidate, 'candidate')
        ->create([
            'match_run_id' => $run->getKey(),
            'institution_id' => $institution->getKey(),
            'project_id' => $recommendedProject->getKey(),
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
                    'reason' => 'Internal detail.',
                ],
            ],
        ]);

    Project::factory()
        ->open()
        ->for($institution)
        ->for($candidate, 'owner')
        ->create(['title' => 'Project Aktif Satu']);
    Project::factory()
        ->forming()
        ->for($institution)
        ->for($candidate, 'owner')
        ->create(['title' => 'Project Aktif Dua']);

    return compact('candidate', 'institution', 'recommendation');
}

test('dashboard renders application data and safe recommendation reasons', function () {
    $context = dashboardBrowserContext();
    $this->actingAs($context['candidate']);

    visit(route('dashboard'))
        ->resize(1366, 900)
        ->assertDataAttribute('@dashboard-root', 'dashboard-source', 'application')
        ->assertSee('Project Recommendation Nyata')
        ->assertSee('Kebutuhan project cocok dengan profilmu.')
        ->assertSee('Skill riset pengguna dibutuhkan tim.')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('dashboard ignores the retired client preview query', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    visit(route('dashboard', ['state' => 'revision']))
        ->assertDataAttribute('@dashboard-root', 'dashboard-source', 'application')
        ->assertSee('Hubungkan afiliasi kampus')
        ->assertSee('Recommendation menunggu afiliasi terverifikasi')
        ->assertNoJavaScriptErrors();
});

test('dashboard keeps the docket before ledger and context rail on mobile', function () {
    $context = dashboardBrowserContext();
    $this->actingAs($context['candidate']);

    visit(route('dashboard'))
        ->resize(320, 800)
        ->assertScript(
            <<<'JS'
function() {
    const docket = document.querySelector('[data-test="dashboard-docket"]');
    const ledger = document.querySelector('[data-test="dashboard-ledger"]');
    const rail = document.querySelector('[data-test="dashboard-context-rail"]');

    return Boolean(
        docket
        && ledger
        && rail
        && docket.getBoundingClientRect().top < ledger.getBoundingClientRect().top
        && ledger.getBoundingClientRect().top < rail.getBoundingClientRect().top
    );
}
JS,
            true,
        )
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoAccessibilityIssues();
});

test('dashboard preserves the priority scan on a small laptop', function () {
    $context = dashboardBrowserContext();
    $this->actingAs($context['candidate']);

    visit(route('dashboard'))
        ->resize(1366, 768)
        ->assertScript(
            <<<'JS'
function() {
    const primaryAction = document.querySelector('[data-test="dashboard-primary-action"]');
    const projectRows = document.querySelectorAll('[data-test="dashboard-project-row"]');
    const recommendationReason = document.querySelector('[data-test="dashboard-recommendation-reason"]');
    const required = [primaryAction, projectRows[0], recommendationReason];

    return projectRows.length >= 2 && required.every((element) => {
        if (!element) {
            return false;
        }

        const bounds = element.getBoundingClientRect();

        return bounds.top >= 0 && bounds.bottom <= window.innerHeight;
    });
}
JS,
            true,
        )
        ->assertNoJavaScriptErrors();
});

test('dashboard controls expose pointer targets and keyboard navigation', function () {
    $context = dashboardBrowserContext();
    $this->actingAs($context['candidate']);

    visit(route('dashboard'))
        ->resize(1366, 900)
        ->assertScript(
            <<<'JS'
function() {
    const selectors = [
        '[data-test="theme-toggle"]',
        '[data-test="sidebar-trigger"]',
        '[data-test="user-menu-button"]',
        '[data-test="dashboard-primary-action"]',
        '[data-test="dashboard-project-row"] a',
    ];

    return selectors.every((selector) => {
        const element = document.querySelector(selector);

        return element && getComputedStyle(element).cursor === 'pointer';
    });
}
JS,
            true,
        )
        ->keys('@dashboard-primary-action', 'Enter')
        ->wait(0.3)
        ->assertScript(
            'window.location.pathname.includes("/projects/")',
            true,
        );
});

test('dashboard hides a recommendation through the real feedback command', function () {
    $context = dashboardBrowserContext();
    $this->actingAs($context['candidate']);

    visit(route('dashboard'))
        ->resize(390, 844)
        ->click('@dashboard-recommendation-hide')
        ->wait(0.3)
        ->assertSee('Belum ada recommendation project')
        ->assertNoJavaScriptErrors()
        ->assertNoAccessibilityIssues();
});

test('dashboard respects dark mode and reduced motion-safe regions', function () {
    $context = dashboardBrowserContext();
    $this->actingAs($context['candidate']);

    visit(route('dashboard'))
        ->inDarkMode()
        ->assertScript('document.documentElement.classList.contains(\'dark\')', true)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoAccessibilityIssues()
        ->assertNoJavaScriptErrors();
});

test('dashboard screenshot evidence covers real desktop and mobile data', function (
    int $width,
    int $height,
    bool $darkMode,
    bool $fullPage,
    string $filename,
) {
    $context = dashboardBrowserContext();
    $this->actingAs($context['candidate']);

    $page = $darkMode
        ? visit(route('dashboard'))->inDarkMode()
        : visit(route('dashboard'));

    $page
        ->resize($width, $height)
        ->assertDataAttribute('@dashboard-root', 'dashboard-source', 'application')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot($fullPage, $filename);
})->with([
    'real light desktop' => [
        1366,
        900,
        false,
        false,
        'p28-dashboard-real-light-1366x900',
    ],
    'real dark mobile' => [
        390,
        844,
        true,
        true,
        'p28-dashboard-real-dark-390x844-full',
    ],
]);
