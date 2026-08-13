<?php

use App\Models\Contribution;
use App\Models\Institution;
use App\Models\Project;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Support\Facades\Artisan;
use Laravel\Pennant\Feature;

function seedSyntheticDemoForBrowser(): void
{
    config(['app.demo_state' => 'typical']);
    Artisan::call('db:seed', ['--class' => DemoSeeder::class]);
}

test('synthetic workspace and contribution projections render without browser errors', function () {
    seedSyntheticDemoForBrowser();

    $institution = Institution::query()->where('slug', 'synthetic-universitas-sintetik-alpha')->firstOrFail();
    $student = User::query()->where('username', 'synthetic-universitas-sintetik-alpha-student-2')->firstOrFail();
    $project = Project::query()
        ->where('institution_id', $institution->getKey())
        ->where('title', 'Synthetic Cross-Program Project 1')
        ->firstOrFail();
    $contribution = Contribution::query()
        ->where('owner_id', $student->getKey())
        ->where('project_id', $project->getKey())
        ->firstOrFail();

    $this->actingAs($student);

    visit(route('projects.workspace', $project))
        ->resize(1366, 900)
        ->assertSee('Synthetic task: validasi kebutuhan')
        ->assertSee('Synthetic workspace note 1')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p68-demo-workspace-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    visit(route('contributions.show', $contribution))
        ->resize(390, 844)
        ->assertSee('Synthetic approved contribution')
        ->assertSee('synthetic-contribution-approved-')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p68-demo-contribution-mobile-390x844-full')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('synthetic campus queue and gated inclusion render without browser errors', function () {
    seedSyntheticDemoForBrowser();

    $institution = Institution::query()->where('slug', 'synthetic-universitas-sintetik-alpha')->firstOrFail();
    $admin = User::query()->where('username', 'synthetic-universitas-sintetik-alpha-admin')->firstOrFail();
    Feature::for($admin)->activate('inclusion-signal-engine');
    $this->actingAs($admin);

    visit(route('campus.affiliations.index', $institution))
        ->resize(1366, 900)
        ->assertSee('Antrean pemeriksaan')
        ->assertSee('synthetic-universitas-sintetik-alpha-queue-student')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p68-demo-campus-queue-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    visit(route('campus.inclusion.index', $institution))
        ->resize(390, 844)
        ->assertSee('Peninjauan Inklusi Mahasiswa')
        ->assertSee('Synthetic')
        ->assertSee('Kecukupan data terpenuhi')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p68-demo-inclusion-mobile-390x844-full')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});
