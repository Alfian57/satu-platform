<?php

use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\ProjectRoleSkill;
use App\Models\SkillTaxonomy;
use App\Models\User;

/**
 * @return array{0: User, 1: Institution}
 */
function browserProjectViewerContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas SATU',
    ]);
    $viewer = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($viewer)
        ->for($institution)
        ->create();

    return [$viewer, $institution];
}

test('student can filter project discovery and move through paginated results', function () {
    [$viewer, $institution] = browserProjectViewerContext();
    $skill = SkillTaxonomy::factory()->create(['name' => 'Laravel']);

    $firstProject = Project::factory()
        ->for($institution)
        ->create([
            'title' => 'Laravel Platform',
            'deadline' => now()->addDays(2),
        ]);
    $firstRole = ProjectRole::factory()->for($firstProject)->create([
        'title' => 'Backend Engineer',
    ]);
    ProjectRoleSkill::factory()
        ->for($firstRole, 'projectRole')
        ->for($skill, 'taxonomy')
        ->create();

    $secondProject = Project::factory()
        ->forming()
        ->for($institution)
        ->create([
            'title' => 'Laravel Campus Network',
            'deadline' => now()->addDays(3),
        ]);

    $this->actingAs($viewer);

    visit(route('projects.index', [
        'q' => 'Laravel',
        'status' => 'open,forming',
        'visibility' => 'institution,public',
        'per_page' => 1,
    ]))
        ->resize(1366, 900)
        ->assertSee('Laravel Platform')
        ->assertSee('Backend Engineer')
        ->assertSee('Laravel')
        ->assertValue('#project-search', 'Laravel')
        ->screenshot(true, 'p25-project-discovery-desktop-1366x900')
        ->click('button[aria-label="Halaman berikutnya"]')
        ->wait(0.3)
        ->assertSee('Laravel Campus Network')
        ->assertScript('window.location.search.includes("page=2")', true)
        ->fill('#project-search', 'Campus')
        ->press('Terapkan filter')
        ->wait(0.3)
        ->assertSee('Laravel Campus Network')
        ->assertScript('window.location.search.includes("q=Campus")', true)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('project discovery keeps long content within a mobile viewport and recovers from empty results', function () {
    [$viewer, $institution] = browserProjectViewerContext();
    $project = Project::factory()->for($institution)->create([
        'title' => 'Project dengan judul panjang untuk memastikan ledger tetap dapat dipindai',
        'description' => str_repeat(
            'Project ini membutuhkan kolaborasi lintas skill dengan catatan yang tetap dapat dibaca. ',
            12,
        ),
    ]);

    $this->actingAs($viewer);

    visit(route('projects.index', ['q' => 'Tidak Ada Project Ini']))
        ->resize(320, 800)
        ->assertSee('Belum ada project yang cocok')
        ->screenshot(true, 'p25-project-discovery-empty-mobile-320x800')
        ->click('[data-test="projects-reset-empty"]')
        ->wait(0.3)
        ->assertSee($project->title)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
