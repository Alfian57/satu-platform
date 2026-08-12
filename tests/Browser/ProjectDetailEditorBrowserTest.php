<?php

use App\Enums\ProjectVisibility;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\User;

/**
 * @return array{0: User, 1: Institution}
 */
function browserProjectDetailOwnerContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Detail Browser',
    ]);
    $owner = User::factory()->create();

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($owner)
        ->for($institution)
        ->create();

    return [$owner, $institution];
}

test('owner can inspect project detail and save editor changes across layouts', function () {
    [$owner, $institution] = browserProjectDetailOwnerContext();
    $project = Project::factory()
        ->draft()
        ->for($institution)
        ->for($owner, 'owner')
        ->create([
            'title' => 'Portal kontribusi awal',
            'visibility' => ProjectVisibility::Institution,
        ]);
    ProjectRole::factory()->for($project)->create([
        'title' => 'Frontend engineer',
        'capacity' => 1,
    ]);

    $this->actingAs($owner);

    visit(route('projects.show', $project))
        ->resize(1366, 900)
        ->assertSee('Portal kontribusi awal')
        ->assertSee('Kamu mengelola detail dan lifecycle project ini.')
        ->screenshot(true, 'p26-project-detail-owner-desktop-1366x900')
        ->resize(768, 900)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->resize(1024, 900)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->click('@edit-project')
        ->wait(0.3)
        ->assertSee('Perbarui detail project')
        ->fill('#project-title', 'Portal kontribusi diperbarui')
        ->click('@save-project-changes')
        ->wait(0.5)
        ->assertSee('Portal kontribusi diperbarui')
        ->assertSee('Konteks kerja yang perlu dipahami')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('owner can create and open a project from the mobile editor', function () {
    [$owner, $institution] = browserProjectDetailOwnerContext();

    $this->actingAs($owner);

    visit(route('projects.create', ['institution_id' => $institution->getKey()]))
        ->resize(390, 844)
        ->assertSee('Susun project yang siap dikerjakan bersama.')
        ->fill('#project-title', 'Project baru dari editor')
        ->fill('#project-description', 'Project ini dibuat melalui alur editor.')
        ->fill('#project-role-0-title', 'Product designer')
        ->click('@save-open-project')
        ->wait(0.7)
        ->assertSee('Project baru dari editor')
        ->assertSee('Terbuka')
        ->assertSee('Product designer')
        ->screenshot(true, 'p26-project-detail-open-mobile-390x844')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('owner must confirm destructive lifecycle changes', function () {
    [$owner, $institution] = browserProjectDetailOwnerContext();
    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create([
            'title' => 'Project yang perlu dibatalkan',
        ]);

    $this->actingAs($owner);

    visit(route('projects.show', $project))
        ->resize(390, 844)
        ->click('@cancel-project')
        ->assertSee('Batalkan project ini?')
        ->fill('#project-transition-reason', 'Scope project berubah')
        ->click('@confirm-project-transition')
        ->wait(0.5)
        ->assertSee('Dibatalkan')
        ->screenshot(true, 'p26-project-detail-cancelled-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('reader sees project detail in read-only mode', function () {
    [$owner, $institution] = browserProjectDetailOwnerContext();
    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($owner, 'owner')
        ->create([
            'title' => 'Project untuk dibaca',
        ]);

    $reader = User::factory()->create();
    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($reader)
        ->for($institution)
        ->create();

    $this->actingAs($reader);

    visit(route('projects.show', $project))
        ->resize(320, 800)
        ->assertSee('Mode baca')
        ->assertMissing('@edit-project')
        ->assertMissing('@cancel-project')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
