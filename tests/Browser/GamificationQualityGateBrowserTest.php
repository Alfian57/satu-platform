<?php

use App\Enums\LeaderboardScopeType;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\LeaderboardPeriod;
use App\Models\LeaderboardProjection;
use App\Models\User;

test('leaderboard quality gate covers deferred loading and captures clean evidence', function () {
    $context = qualityGateBrowserContext();
    $this->actingAs($context['user']);

    $page = visit(route('leaderboards.index'))
        ->resize(1366, 900)
        ->assertScript(
            <<<'JS'
function() {
    const loading = document.querySelector('[data-test="leaderboard-loading"]');

    if (!loading) {
        return false;
    }

    return loading.getAttribute('aria-busy') === 'true'
        && loading.querySelector('[role="status"]')?.textContent?.includes('Memuat papan peringkat.')
        && loading.querySelectorAll('[data-slot="skeleton"]').length >= 10;
}
JS,
            true,
        )
        ->screenshot(false, 'p98-leaderboard-quality-loading-desktop-1366x900')
        ->waitForText($context['longLabel'])
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    $page
        ->assertScript(
            <<<'JS'
function() {
    const results = document.querySelector('#leaderboard-results');
    const table = document.querySelector('table');
    const rows = document.querySelectorAll('[data-test="leaderboard-desktop-row"]');
    const rowHeaders = document.querySelectorAll('tbody th[scope="row"]');
    const status = document.querySelector('[data-test="leaderboard-root"]');

    return results?.getAttribute('aria-busy') === 'false'
        && table?.querySelector('caption') !== null
        && table?.querySelectorAll('thead th[scope="col"]').length === 5
        && rowHeaders.length === rows.length
        && status?.getAttribute('data-leaderboard-source') === 'application'
        && document.querySelector('[role="tablist"]')?.querySelectorAll('[role="tab"]').length === 2
        && rows.length === 10
        && document.querySelector('[data-test="leaderboard-next-page"]') !== null;
}
JS,
            true,
        )
        ->assertScript(
            <<<'JS'
function() {
    const styles = Array.from(document.styleSheets).flatMap((sheet) => {
        try {
            return Array.from(sheet.cssRules).map((rule) => rule.cssText);
        } catch {
            return [];
        }
    }).join(' ');
    const row = document.querySelector('[data-test="leaderboard-desktop-row"]');

    return styles.includes('prefers-reduced-motion')
        && row?.classList.contains('motion-reduce:transition-none') === true;
}
JS,
            true,
        )
        ->screenshot(false, 'p98-leaderboard-quality-desktop-1366x900');

    $previousSemester = json_encode($context['previousSemester'], JSON_THROW_ON_ERROR);

    $page
        ->keys('button[role="tab"][aria-selected="true"]', 'End')
        ->wait(0.8)
        ->assertScript(
            'new URL(window.location.href).searchParams.get("semester") === '.$previousSemester,
            true,
        )
        ->assertScript(
            <<<'JS'
document.querySelectorAll('button[role="tab"][aria-selected="true"]').length === 1
JS,
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    $page
        ->resize(320, 800)
        ->wait(0.4)
        ->assertScript(
            <<<'JS'
function() {
    const mobileRows = document.querySelectorAll('[data-test="leaderboard-mobile-row"]');
    const desktopTable = document.querySelector('.md\\:block');

    return document.documentElement.scrollWidth <= document.documentElement.clientWidth
        && mobileRows.length === 10
        && desktopTable !== null
        && getComputedStyle(desktopTable).display === 'none'
        && document.body.innerText.includes('Program studi dengan nama yang sangat panjang');
}
JS,
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, 'p98-leaderboard-quality-mobile-320x800-full');
});

test('leaderboard quality gate remains accessible in dark mode with high-content rows', function () {
    $context = qualityGateBrowserContext();
    $this->actingAs($context['user']);

    visit(route('leaderboards.index'))
        ->inDarkMode()
        ->resize(1024, 768)
        ->waitForText($context['longLabel'])
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(false, 'p98-leaderboard-quality-dark-1024x768');
});

/**
 * @return array{
 *     institution: Institution,
 *     user: User,
 *     longLabel: string,
 *     previousSemester: string,
 * }
 */
function qualityGateBrowserContext(): array
{
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Quality Gate Browser',
    ]);
    $user = User::factory()->create(['name' => 'Student Quality Browser']);
    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();

    $semesters = [
        '2025/2026 Genap',
        '2026/2027 Ganjil',
    ];
    $longLabel = 'Program studi dengan nama yang sangat panjang untuk menguji reflow';

    foreach ($semesters as $semesterIndex => $semester) {
        $digest = hash('sha256', 'quality-gate-'.$semester);
        $period = LeaderboardPeriod::factory()
            ->for($institution)
            ->create([
                'semester' => $semester,
                'latest_snapshot_digest' => $digest,
                'computed_at' => now()->subHours(2 - $semesterIndex),
            ]);

        for ($rowIndex = 1; $rowIndex <= 12; $rowIndex++) {
            $scopeLabel = $rowIndex === 1
                ? $longLabel
                : 'Program studi '.$rowIndex;
            $scopeKey = 'program:quality-'.$semesterIndex.'-'.$rowIndex;

            LeaderboardProjection::factory()
                ->for($period, 'period')
                ->for($institution)
                ->create([
                    'scope_type' => LeaderboardScopeType::Program,
                    'scope_key' => $scopeKey,
                    'scope_label' => $scopeLabel,
                    'rank' => $rowIndex,
                    'score' => number_format(40 - $rowIndex, 4, '.', ''),
                    'verified_xp_total' => (40 - $rowIndex) * 5,
                    'active_member_denominator' => 5,
                    'cohort_size' => 5,
                    'snapshot_digest' => $digest,
                    'snapshot_key' => hash('sha256', $digest.'|'.$scopeKey),
                ]);
        }
    }

    return [
        'institution' => $institution,
        'user' => $user,
        'longLabel' => $longLabel,
        'previousSemester' => $semesters[0],
    ];
}
