<?php

use App\Enums\PortfolioVisibility;
use App\Models\Contribution;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\User;

test('public portfolio is readable and responsive without browser errors', function () {
    $context = publicPortfolioBrowserContext();
    publicPortfolioBrowserEntry($context['profile']);

    $page = visit(route('portfolio.share', $context['profile']->public_identifier))
        ->resize(390, 844)
        ->assertSee('Student Browser Public Portfolio')
        ->assertSee('Portfolio publik')
        ->assertSee('Institution-verified')
        ->assertSee('Contribution disetujui')
        ->assertScript(
            "document.querySelector('meta[name=robots]')?.getAttribute('content')",
            'index, follow',
        )
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p49-public-portfolio-mobile-390x844');

    $page
        ->resize(1366, 900)
        ->assertSee('PROYEKSI YANG DIIZINKAN')
        ->assertSee('Universitas Browser Public Portfolio')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p49-public-portfolio-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('revoked public portfolio renders a recoverable unavailable state', function () {
    $context = publicPortfolioBrowserContext([
        'portfolio_visibility' => PortfolioVisibility::Private,
    ]);
    publicPortfolioBrowserEntry($context['profile']);

    visit(route('portfolio.share', $context['profile']->public_identifier))
        ->resize(390, 844)
        ->assertSee('Portfolio ini tidak tersedia untuk dibaca.')
        ->assertSee('Data privat')
        ->assertSee('Kembali ke SATU')
        ->assertScript(
            "document.querySelector('meta[name=robots]')?.getAttribute('content')",
            'noindex, nofollow',
        )
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p49-public-portfolio-unavailable-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

/**
 * @param  array{portfolio_visibility?: PortfolioVisibility}  $overrides
 * @return array{institution: Institution, student: User, profile: StudentProfile}
 */
function publicPortfolioBrowserContext(array $overrides = []): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Browser Public Portfolio',
    ]);
    $student = User::factory()->create([
        'name' => 'Student Browser Public Portfolio',
    ]);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    $profile = StudentProfile::factory()
        ->for($student)
        ->for($institution)
        ->create([
            'portfolio_visibility' => PortfolioVisibility::Public,
            'recruiter_discoverable' => true,
            ...$overrides,
        ]);

    return compact('institution', 'student', 'profile');
}

function publicPortfolioBrowserEntry(StudentProfile $profile): PortfolioEntry
{
    $project = Project::factory()
        ->for($profile->institution)
        ->for($profile->user, 'owner')
        ->open()
        ->create(['title' => 'Project Browser Public Portfolio']);
    $task = Task::factory()
        ->for($project)
        ->for($profile->user, 'createdBy')
        ->create(['title' => 'Task Browser Public Portfolio']);
    $contribution = Contribution::factory()
        ->for($profile->institution)
        ->for($profile->user, 'owner')
        ->for($project)
        ->approved()
        ->create();
    $version = ContributionVersion::factory()
        ->forContribution($contribution)
        ->for($task, 'task')
        ->create([
            'summary' => 'Ringkasan browser public portfolio.',
        ]);
    $contribution->forceFill(['current_version_id' => $version->getKey()])->save();

    return PortfolioEntry::factory()->create([
        'institution_id' => $profile->institution_id,
        'user_id' => $profile->user_id,
        'contribution_id' => $contribution->getKey(),
        'contribution_version_id' => $version->getKey(),
        'title' => 'Public Browser Portfolio Entry',
        'summary' => 'Ringkasan entry yang aman untuk dibaca publik.',
        'visibility' => PortfolioVisibility::Public,
        'published_at' => now(),
    ]);
}
