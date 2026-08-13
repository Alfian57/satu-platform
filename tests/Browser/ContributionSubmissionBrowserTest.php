<?php

use App\Enums\ContributionStatus;
use App\Enums\PortfolioVisibility;
use App\Models\Attachment;
use App\Models\Contribution;
use App\Models\ContributionEvidence;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

test('student can compose a contribution from task evidence and inspect its receipt', function () {
    $context = contributionBrowserContext();

    $this->actingAs($context['student']);

    $page = visit(route('contributions.create'))
        ->resize(390, 844)
        ->assertSee('Susun contribution dari pekerjaan yang sudah kamu lakukan.')
        ->assertSelected('#contribution-create-task', (string) $context['task']->getKey());

    $page->script("document.querySelector('#contribution-create-claim').focus()");
    $page
        ->assertScript(
            "document.activeElement?.id === 'contribution-create-claim'",
            true,
        )
        ->fill('#contribution-create-claim', 'Menyusun alur validasi dari workspace.')
        ->fill(
            '#contribution-create-summary',
            'Saya menyusun alur validasi dengan task dan evidence private yang dapat ditinjau.',
        )
        ->click("[data-test=contribution-evidence-{$context['attachment']->getKey()}]")
        ->screenshot(true, 'p43-contribution-composer-mobile-390x844');

    $page
        ->click('@contribution-create-submit')
        ->waitForText('Contribution')
        ->assertSee('Versi aktif')
        ->assertSee('catatan-browser.pdf')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p43-contribution-draft-receipt-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect(Contribution::query()->count())->toBe(1);
});

test('student can send a draft for validation and see the pending boundary on desktop', function () {
    $context = contributionBrowserContext();
    $contribution = contributionBrowserContribution($context, ContributionStatus::Draft);

    $this->actingAs($context['student']);

    visit(route('contributions.index'))
        ->resize(1366, 900)
        ->assertSee('Project browser contribution')
        ->assertSee('Draft')
        ->click("[data-test=contribution-row-{$contribution->getKey()}]")
        ->waitForText('Kirim untuk validasi')
        ->click('@contribution-submit')
        ->waitForText('Contribution sudah dikirim untuk validasi kampus.')
        ->assertSee('Menunggu validasi')
        ->assertSee('Mode baca. Perubahan menunggu keputusan reviewer.')
        ->screenshot(true, 'p43-contribution-pending-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect($contribution->refresh()->status)->toBe(ContributionStatus::Pending);
});

test('student can respond to revision feedback without losing version history', function () {
    $context = contributionBrowserContext();
    $contribution = contributionBrowserContribution($context, ContributionStatus::Revision);
    ContributionReview::factory()
        ->for($contribution->currentVersion, 'contributionVersion')
        ->for($context['reviewer'], 'reviewer')
        ->revisionRequested('Tambahkan penjelasan keputusan dan evidence yang relevan.')
        ->create();

    $this->actingAs($context['student']);

    visit(route('contributions.show', $contribution))
        ->resize(390, 844)
        ->assertSee('Perlu diperbaiki')
        ->assertSee('Tambahkan penjelasan keputusan dan evidence yang relevan.')
        ->assertSee('Tanggapi feedback tanpa menghapus history.')
        ->fill('#contribution-revision-claim', 'Menanggapi catatan reviewer dengan provenance baru.')
        ->fill(
            '#contribution-revision-summary',
            'Versi ini menambahkan penjelasan keputusan dan tetap menautkan evidence private.',
        )
        ->click('@contribution-revision-submit')
        ->waitForText('Versi baru tersimpan sebagai draft.')
        ->assertSee('Versi 2')
        ->assertSee('APPEND-ONLY HISTORY')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p43-contribution-revision-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect($contribution->refresh()->status)->toBe(ContributionStatus::Draft)
        ->and($contribution->versions()->count())->toBe(2);
});

test('student can trace an approved contribution from task to portfolio', function () {
    $context = contributionBrowserContext();
    $contribution = contributionBrowserContribution($context, ContributionStatus::Approved);
    ContributionReview::factory()
        ->for($contribution->currentVersion, 'contributionVersion')
        ->for($context['reviewer'], 'reviewer')
        ->approved()
        ->create();
    $entry = PortfolioEntry::factory()->create([
        'institution_id' => $context['institution']->getKey(),
        'user_id' => $context['student']->getKey(),
        'contribution_id' => $contribution->getKey(),
        'contribution_version_id' => $contribution->current_version_id,
        'title' => 'Portfolio provenance browser entry',
        'visibility' => PortfolioVisibility::Private,
    ]);

    $this->actingAs($context['student']);

    $page = visit(route('contributions.show', $contribution))
        ->resize(390, 844)
        ->assertSee('Dari task ke portfolio')
        ->assertSee('Outcome portfolio tersedia')
        ->assertSee($context['task']->title)
        ->assertSee('Buka portfolio')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p50-contribution-provenance-mobile-390x844');

    $page
        ->resize(1366, 900)
        ->assertSee('Portfolio provenance browser entry')
        ->assertPresent('@contribution-portfolio-link')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p50-contribution-provenance-desktop-1366x900')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect($entry->refresh()->contribution_version_id)
        ->toBe($contribution->current_version_id);
});

test('contribution list exposes a stable refresh skeleton on a small laptop', function () {
    $context = contributionBrowserContext();
    contributionBrowserContribution($context, ContributionStatus::Draft);

    $this->actingAs($context['student']);

    $page = visit(route('contributions.index'))
        ->resize(1366, 768)
        ->assertSee('Project browser contribution');

    $page->script(<<<'JS'
        (() => {
            let delayed = false;
            const originalFetch = window.fetch.bind(window);
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            window.fetch = (input, init) => {
                const url = typeof input === 'string' ? input : input?.url ?? '';

                if (!delayed && String(url).includes('/contributions')) {
                    delayed = true;

                    return new Promise((resolve) => {
                        setTimeout(() => resolve(originalFetch(input, init)), 1200);
                    });
                }

                return originalFetch(input, init);
            };

            XMLHttpRequest.prototype.open = function (method, url, ...rest) {
                this.__pestContributionRequest = String(url).includes('/contributions');

                return originalOpen.call(this, method, url, ...rest);
            };

            XMLHttpRequest.prototype.send = function (...args) {
                if (!delayed && this.__pestContributionRequest) {
                    delayed = true;
                    setTimeout(() => originalSend.apply(this, args), 1200);

                    return;
                }

                return originalSend.apply(this, args);
            };
        })();
        JS);

    $page
        ->click('@contributions-refresh')
        ->assertScript(
            "document.querySelector('[data-test=contributions-loading]')?.getAttribute('aria-busy') === 'true'",
            true,
        )
        ->screenshot(true, 'p43-contribution-refresh-loading-1366x768')
        ->waitForText('Contribution milikmu')
        ->assertScript(
            "document.querySelector('[data-test=contributions-loading]') === null",
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('contribution refresh failure preserves the ledger and offers recovery', function () {
    $context = contributionBrowserContext();
    $contribution = contributionBrowserContribution($context, ContributionStatus::Draft);

    $this->actingAs($context['student']);

    $page = visit(route('contributions.index'))
        ->resize(1366, 768)
        ->assertSee('Project browser contribution');

    $page->script(<<<'JS'
        (() => {
            let failed = false;
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function (method, url, ...rest) {
                this.__pestContributionRequest = String(url).includes('/contributions');

                return originalOpen.call(this, method, url, ...rest);
            };

            XMLHttpRequest.prototype.send = function (...args) {
                if (!failed && this.__pestContributionRequest) {
                    failed = true;
                    window.setTimeout(() => {
                        const error = new ProgressEvent('error');

                        if (typeof this.onerror === 'function') {
                            this.onerror(error);
                        } else {
                            this.dispatchEvent(error);
                        }
                    }, 40);

                    return;
                }

                return originalSend.apply(this, args);
            };
        })();
        JS);

    $page
        ->click('@contributions-refresh')
        ->waitForText('Periksa koneksi lalu coba lagi.')
        ->assertPresent("@contribution-row-{$contribution->getKey()}")
        ->assertScript(
            "document.querySelector('[data-test=contributions-ledger]')?.getAttribute('aria-busy') === 'false'",
            true,
        )
        ->assertEnabled('@contributions-refresh')
        ->screenshot(true, 'p51-contribution-refresh-error-desktop-1366x768')
        ->click('@contributions-refresh')
        ->waitForText('Contribution milikmu')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

test('empty contribution state stays usable on mobile', function () {
    $context = contributionBrowserContext();

    $this->actingAs($context['student']);

    visit(route('contributions.index'))
        ->resize(390, 844)
        ->waitForText('Belum ada contribution')
        ->assertSee('Susun contribution pertama')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->screenshot(true, 'p51-contribution-empty-mobile-390x844')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
});

/**
 * @return array{institution: Institution, student: User, reviewer: User, project: Project, task: Task, attachment: Attachment}
 */
function contributionBrowserContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Browser Contribution',
    ]);
    $student = User::factory()->create(['name' => 'Student Browser Contribution']);
    $reviewer = User::factory()->create(['name' => 'Reviewer Browser Contribution']);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($student)
        ->for($institution)
        ->create();

    InstitutionMembership::factory()
        ->campusAdmin()
        ->verifiedByCampusAdmin($student)
        ->for($reviewer)
        ->for($institution)
        ->create();

    $project = Project::factory()
        ->open()
        ->for($institution)
        ->for($student, 'owner')
        ->create(['title' => 'Project browser contribution']);
    $task = Task::factory()
        ->for($project)
        ->for($student, 'createdBy')
        ->create(['title' => 'Task browser contribution']);
    $attachment = Attachment::factory()
        ->evidence()
        ->for($project)
        ->for($student, 'uploadedBy')
        ->create(['original_name' => 'catatan-browser.pdf']);

    return compact('institution', 'student', 'reviewer', 'project', 'task', 'attachment');
}

/**
 * @param  array{project: Project, student: User, task: Task, attachment: Attachment}  $context
 */
function contributionBrowserContribution(
    array $context,
    ContributionStatus $status,
): Contribution {
    $contribution = Contribution::factory()
        ->state(['status' => $status])
        ->for($context['project'])
        ->for($context['student'], 'owner')
        ->create(['institution_id' => $context['project']->institution_id]);
    $version = ContributionVersion::factory()
        ->forContribution($contribution)
        ->state(['task_id' => $context['task']->getKey()])
        ->create([
            'claim' => 'Klaim browser contribution.',
            'summary' => 'Ringkasan pekerjaan browser contribution yang panjang dan tetap dapat dibaca.',
        ]);
    ContributionEvidence::query()->forceCreate([
        'contribution_version_id' => $version->getKey(),
        'attachment_id' => $context['attachment']->getKey(),
        'source_label' => $context['attachment']->original_name,
        'notes' => null,
    ]);

    $contribution->forceFill(['current_version_id' => $version->getKey()])->save();

    return $contribution->fresh(['currentVersion']);
}
