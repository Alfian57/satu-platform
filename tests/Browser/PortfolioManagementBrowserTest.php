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

test('student can manage portfolio audiences with mobile and desktop evidence', function () {
    $context = portfolioBrowserContext();
    $entry = portfolioBrowserEntry($context);

    $this->actingAs($context['student']);

    $page = visit(route('portfolio.index'))
        ->resize(390, 844)
        ->waitForText('Portfolio page entry')
        ->assertSee('Institution-verified')
        ->assertSee('Kendali publikasi')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p48-portfolio-management-mobile-390x844');

    $page
        ->select("[data-test=portfolio-entry-{$entry->getKey()}-visibility]", 'recruiter')
        ->click("@portfolio-entry-{$entry->getKey()}-visibility-save")
        ->waitForText('Audience entry sudah diperbarui.')
        ->assertSee('Terbit sesuai audience')
        ->select('[data-test=portfolio-profile-visibility]', 'recruiter')
        ->click('@portfolio-profile-save')
        ->waitForText('Pengaturan portfolio sudah tersimpan.')
        ->resize(1366, 900)
        ->assertSee('PROYEKSI RECRUITER')
        ->assertSee('TENANT: Universitas Browser Portfolio')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p48-portfolio-management-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect($entry->refresh()->visibility)->toBe(PortfolioVisibility::Recruiter)
        ->and($context['profile']->refresh()->portfolio_visibility)
        ->toBe(PortfolioVisibility::Recruiter);
});

test('student can inspect the portfolio provenance detail on mobile', function () {
    $context = portfolioBrowserContext();
    $entry = portfolioBrowserEntry($context);

    $this->actingAs($context['student']);

    visit(route('portfolio.show', $entry))
        ->resize(390, 844)
        ->assertSee('Portfolio page entry')
        ->assertSee('Jejak sumber')
        ->assertSee('Contribution #')
        ->assertSee('Institution-verified')
        ->assertSee('Kendali publikasi')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p48-portfolio-detail-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('portfolio empty state remains usable on desktop', function () {
    $context = portfolioBrowserContext();

    $this->actingAs($context['student']);

    visit(route('portfolio.index'))
        ->resize(1366, 900)
        ->waitForText('Belum ada entry portfolio')
        ->assertSee('Lihat contribution')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p48-portfolio-empty-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('portfolio refresh keeps the current ledger visible while loading', function () {
    $context = portfolioBrowserContext();
    portfolioBrowserEntry($context);

    $this->actingAs($context['student']);

    $page = visit(route('portfolio.index'))
        ->resize(1366, 768)
        ->waitForText('Portfolio page entry');

    $page->script(<<<'JS'
        (() => {
            let delayed = false;
            const originalFetch = window.fetch.bind(window);
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            window.fetch = (input, init) => {
                const url = typeof input === 'string' ? input : input?.url ?? '';

                if (!delayed && String(url).includes('/portfolio')) {
                    delayed = true;

                    return new Promise((resolve) => {
                        setTimeout(() => resolve(originalFetch(input, init)), 1200);
                    });
                }

                return originalFetch(input, init);
            };

            XMLHttpRequest.prototype.open = function (method, url, ...rest) {
                this.__pestPortfolioRequest = String(url).includes('/portfolio');

                return originalOpen.call(this, method, url, ...rest);
            };

            XMLHttpRequest.prototype.send = function (...args) {
                if (!delayed && this.__pestPortfolioRequest) {
                    delayed = true;
                    setTimeout(() => originalSend.apply(this, args), 1200);

                    return;
                }

                return originalSend.apply(this, args);
            };
        })();
        JS);

    $page
        ->click('@portfolio-refresh')
        ->assertScript(
            "document.querySelector('[data-test=portfolio-refreshing]')?.getAttribute('role') === 'status'",
            true,
        )
        ->assertScript(
            "document.querySelector('[data-test=portfolio-refresh-skeleton]') !== null",
            true,
        )
        ->screenshot(true, 'p48-portfolio-refresh-loading-1366x768')
        ->wait(1.6)
        ->assertScript(
            "document.querySelector('[data-test=portfolio-refreshing]') === null",
            true,
        )
        ->assertSee('Portfolio page entry')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

/**
 * @return array{institution: Institution, student: User, profile: StudentProfile, project: Project, task: Task, contribution: Contribution, version: ContributionVersion}
 */
function portfolioBrowserContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Browser Portfolio',
    ]);
    $student = User::factory()->create([
        'name' => 'Student Browser Portfolio',
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
        ]);
    $project = Project::factory()
        ->for($institution)
        ->for($student, 'owner')
        ->open()
        ->create(['title' => 'Project browser portfolio']);
    $task = Task::factory()
        ->for($project)
        ->for($student, 'createdBy')
        ->create(['title' => 'Task browser portfolio']);
    $contribution = Contribution::factory()
        ->for($institution)
        ->for($student, 'owner')
        ->for($project)
        ->approved()
        ->create();
    $version = ContributionVersion::factory()
        ->forContribution($contribution)
        ->for($task, 'task')
        ->create([
            'summary' => 'Ringkasan browser portfolio yang sudah disetujui.',
        ]);
    $contribution->forceFill(['current_version_id' => $version->getKey()])->save();

    return compact(
        'institution',
        'student',
        'profile',
        'project',
        'task',
        'contribution',
        'version',
    );
}

/**
 * @param  array{institution: Institution, student: User, contribution: Contribution, version: ContributionVersion}  $context
 */
function portfolioBrowserEntry(array $context): PortfolioEntry
{
    return PortfolioEntry::factory()->create([
        'institution_id' => $context['institution']->getKey(),
        'user_id' => $context['student']->getKey(),
        'contribution_id' => $context['contribution']->getKey(),
        'contribution_version_id' => $context['version']->getKey(),
        'title' => 'Portfolio page entry',
        'summary' => 'Ringkasan entry browser portfolio untuk halaman student.',
        'visibility' => PortfolioVisibility::Private,
    ]);
}
