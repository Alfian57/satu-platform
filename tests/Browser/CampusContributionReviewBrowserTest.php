<?php

use App\Actions\Contribution\CreateContribution;
use App\Actions\Contribution\SubmitContribution;
use App\Enums\ContributionStatus;
use App\Models\Attachment;
use App\Models\Contribution;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('campus reviewer can inspect provenance and request a revision on desktop', function () {
    $context = campusContributionBrowserContext();
    $contribution = campusBrowserPendingContribution($context);

    $this->actingAs($context['reviewer']);

    visit(route('campus.contributions.index', $context['institution']))
        ->resize(1366, 900)
        ->assertSee('Validasi contribution Universitas Browser Review')
        ->waitForText('Antrean validasi')
        ->assertSee('Browser review project')
        ->click("@campus-contribution-select-{$contribution->getKey()}")
        ->waitForText('Provenance review')
        ->assertSee('browser-review-evidence.pdf')
        ->assertSee('Pratinjau')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(false, 'p46-campus-contribution-review-desktop-1366x900')
        ->click('input[value="revision"]')
        ->fill(
            '#campus-contribution-review-reason',
            'Evidence perlu diperjelas agar provenance contribution mudah diverifikasi.',
        )
        ->click('@campus-contribution-decision-submit')
        ->waitForText('Keputusan tersimpan. Riwayat audit contribution sudah diperbarui.')
        ->assertSee('Antrean kosong')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, 'p46-campus-contribution-review-success-desktop-1366x900');

    expect($contribution->refresh()->status)->toBe(ContributionStatus::Revision);
});

test('campus contribution review stays keyboardable and contained on mobile', function () {
    $context = campusContributionBrowserContext();
    $contribution = campusBrowserPendingContribution($context);

    $this->actingAs($context['reviewer']);

    $page = visit(route('campus.contributions.index', $context['institution']))
        ->resize(390, 844)
        ->assertSee('Validasi contribution Universitas Browser Review')
        ->waitForText('Antrean validasi');

    $page
        ->keys("@campus-contribution-select-{$contribution->getKey()}", 'Enter')
        ->waitForText('Provenance review')
        ->assertScript(
            "document.querySelector('[data-test=campus-contribution-docket]')?.contains(document.activeElement) === true",
            true,
        )
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertSee('Evidence private')
        ->screenshot(true, 'p46-campus-contribution-review-mobile-390x844-full')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('campus contribution review stays contained at tablet and small laptop widths', function () {
    $context = campusContributionBrowserContext();
    $contribution = campusBrowserPendingContribution($context);

    $this->actingAs($context['reviewer']);

    $page = visit(route('campus.contributions.index', $context['institution']))
        ->waitForText('Antrean validasi')
        ->resize(768, 1024)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(false, 'p46-campus-contribution-review-tablet-768x1024')
        ->resize(1024, 768)
        ->click("@campus-contribution-select-{$contribution->getKey()}")
        ->waitForText('Provenance review');

    $page->script(
        "document.querySelector('[data-test=campus-contribution-docket]')?.scrollIntoView({block: 'start'})",
    );

    $page
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(false, 'p46-campus-contribution-review-small-laptop-1024x768')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('campus review refresh keeps the current queue visible while loading', function () {
    $context = campusContributionBrowserContext();
    $contribution = campusBrowserPendingContribution($context);

    $this->actingAs($context['reviewer']);

    $page = visit(route('campus.contributions.index', $context['institution']))
        ->resize(1366, 900)
        ->waitForText('Antrean validasi')
        ->assertPresent("@campus-contribution-row-{$contribution->getKey()}");

    $page->script(<<<'JS'
        (() => {
            let delayed = false;
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function (method, url, ...rest) {
                this.__pestCampusContributionRequest = String(url).includes('/campus/');

                return originalOpen.call(this, method, url, ...rest);
            };

            XMLHttpRequest.prototype.send = function (...args) {
                if (!delayed && this.__pestCampusContributionRequest) {
                    delayed = true;
                    window.setTimeout(() => originalSend.apply(this, args), 1200);

                    return;
                }

                return originalSend.apply(this, args);
            };
        })();
        JS);

    $page
        ->click('@campus-contribution-refresh')
        ->wait(0.3)
        ->assertPresent("@campus-contribution-row-{$contribution->getKey()}")
        ->assertScript(
            "document.querySelector('[aria-labelledby=contribution-review-queue-title]')?.getAttribute('aria-busy') === 'true' && document.querySelectorAll('[data-test=campus-contribution-queue-refreshing][role=status]').length === 1",
            true,
        )
        ->screenshot(true, 'p51-campus-review-refresh-loading-desktop-1366x900')
        ->wait(1.6)
        ->assertScript(
            "document.querySelector('[data-test=campus-contribution-queue-refreshing]') === null",
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

/**
 * @return array{institution: Institution, reviewer: User, student: User, project: Project, task: Task, attachment: Attachment}
 */
function campusContributionBrowserContext(): array
{
    Storage::fake('private');

    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Browser Review',
    ]);
    $reviewer = User::factory()->create(['name' => 'Browser Campus Reviewer']);
    $student = User::factory()->create(['name' => 'Browser Contribution Owner']);

    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByApprovedDomain()
        ->for($reviewer)
        ->for($institution)
        ->create();
    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($student, 'owner')
        ->create(['title' => 'Browser review project']);
    $task = Task::factory()
        ->for($project)
        ->for($student, 'createdBy')
        ->create(['title' => 'Browser review task']);
    $attachment = Attachment::factory()
        ->evidence()
        ->for($project)
        ->for($student, 'uploadedBy')
        ->create(['original_name' => 'browser-review-evidence.pdf']);

    Storage::disk('private')->put($attachment->path, 'synthetic browser evidence');

    return compact('institution', 'reviewer', 'student', 'project', 'task', 'attachment');
}

/**
 * @param  array{institution: Institution, reviewer: User, student: User, project: Project, task: Task, attachment: Attachment}  $context
 */
function campusBrowserPendingContribution(array $context): Contribution
{
    $contribution = app(CreateContribution::class)->handle(
        actor: $context['student'],
        project: $context['project'],
        data: [
            'task_id' => $context['task']->getKey(),
            'claim' => 'Browser review contribution claim.',
            'summary' => 'Synthetic browser evidence untuk menguji provenance reviewer.',
            'declaration' => 'Saya menyatakan bahwa contribution ini merepresentasikan pekerjaan saya.',
            'evidence' => [$context['attachment']->getKey()],
        ],
    );

    return app(SubmitContribution::class)->handle($context['student'], $contribution);
}
