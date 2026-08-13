<?php

use App\Enums\LeaderboardScopeType;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\LeaderboardPeriod;
use App\Models\LeaderboardPreference;
use App\Models\LeaderboardProjection;
use App\Models\User;

test('leaderboard data remains usable across desktop and mobile breakpoints', function (
    int $width,
    int $height,
    bool $fullPage,
    string $filename,
) {
    $context = leaderboardBrowserContext();
    $this->actingAs($context['user']);

    visit(route('leaderboards.index'))
        ->resize($width, $height)
        ->waitForText('Informatika')
        ->assertDataAttribute('@leaderboard-root', 'leaderboard-source', 'application')
        ->assertSee('Sistem Informasi')
        ->assertSee('Kohort dilindungi')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot($fullPage, $filename);
})->with([
    'desktop ledger' => [1366, 900, false, 'p97-leaderboard-desktop-1366x900'],
    'mobile ledger' => [390, 844, true, 'p97-leaderboard-mobile-390x844-full'],
]);

test('leaderboard explains ties, protected cohorts, and score provenance', function () {
    $context = leaderboardBrowserContext();
    $this->actingAs($context['user']);

    visit(route('leaderboards.index'))
        ->resize(1366, 900)
        ->waitForText('Informatika')
        ->click('@leaderboard-explanation-trigger')
        ->waitForText('Penjelasan baris leaderboard')
        ->wait(0.3)
        ->assertSee('XP terverifikasi')
        ->assertSee('Denominator aktif')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(false, 'p97-leaderboard-explanation-desktop-1366x900');
});

test('stale leaderboard data explains recovery without hiding the last snapshot', function () {
    $context = leaderboardBrowserContext();
    LeaderboardPeriod::query()
        ->whereBelongsTo($context['institution'])
        ->update(['computed_at' => now()->subHours(25)]);
    $this->actingAs($context['user']);

    visit(route('leaderboards.index'))
        ->resize(1366, 900)
        ->waitForText('Data sedang menunggu perhitungan ulang')
        ->assertSee('Informatika')
        ->assertSee('snapshot terakhir')
        ->click('@leaderboard-refresh')
        ->wait(0.3)
        ->assertSee('Data sedang menunggu perhitungan ulang')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, 'p97-leaderboard-stale-desktop-1366x900');
});

test('individual leaderboard preview shows consent consequences and withdrawal control', function () {
    $context = leaderboardBrowserContext();
    $this->actingAs($context['user']);

    $page = visit(route('leaderboards.index', [
        'semester' => $context['semester'],
        'scope' => LeaderboardScopeType::Individual->value,
    ]))
        ->resize(390, 844)
        ->waitForText('Ranking individual bersifat pilihan')
        ->assertSee('Bisa ditarik kapan saja.')
        ->assertNoJavaScriptErrors()
        ->assertNoAccessibilityIssues()
        ->screenshot(true, 'p97-leaderboard-opt-in-preview-mobile-390x844-full');

    $page
        ->click('@leaderboard-opt-in-open')
        ->waitForText('Tampilkan ranking individual?')
        ->assertSee('Yang terlihat:')
        ->assertSee('Yang tidak terlihat:')
        ->click('@leaderboard-opt-in-confirm')
        ->waitForText('Leaderboard individual diaktifkan.')
        ->assertSee('Tarik dari ranking')
        ->click('@leaderboard-preference-action')
        ->waitForText('Tarik dari ranking individual?')
        ->assertSee('tidak akan ditampilkan lagi')
        ->click('@leaderboard-withdraw-confirm')
        ->waitForText('Leaderboard individual disembunyikan.')
        ->assertSee('Atur visibilitas')
        ->wait(0.4)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();

    expect(LeaderboardPreference::query()
        ->whereBelongsTo($context['user'])
        ->whereBelongsTo($context['institution'])
        ->value('is_opted_in'))->toBeFalse();
});

/**
 * @return array{institution: Institution, user: User, semester: string}
 */
function leaderboardBrowserContext(): array
{
    $semester = '2025/2026 Genap';
    $institution = Institution::factory()->active()->create([
        'name' => 'Universitas Leaderboard Browser',
    ]);
    $user = User::factory()->create(['name' => 'Dian Leaderboard']);

    InstitutionMembership::factory()
        ->student()
        ->verifiedByApprovedDomain()
        ->for($user)
        ->for($institution)
        ->create();

    $digest = hash('sha256', 'leaderboard-browser-fixture');
    $period = LeaderboardPeriod::factory()
        ->for($institution)
        ->create([
            'semester' => $semester,
            'latest_snapshot_digest' => $digest,
            'computed_at' => now()->subHours(2),
        ]);

    foreach ([
        [
            'scope_key' => 'program:informatika',
            'scope_label' => 'Informatika',
            'rank' => 1,
            'shared_rank_group' => 1,
            'score' => '30.0000',
            'verified_xp_total' => 150,
            'active_member_denominator' => 5,
            'cohort_size' => 5,
        ],
        [
            'scope_key' => 'program:sistem-informasi',
            'scope_label' => 'Sistem Informasi',
            'rank' => 1,
            'shared_rank_group' => 1,
            'score' => '30.0000',
            'verified_xp_total' => 150,
            'active_member_denominator' => 5,
            'cohort_size' => 5,
        ],
        [
            'scope_key' => 'program:manajemen',
            'scope_label' => 'Manajemen',
            'rank' => null,
            'shared_rank_group' => null,
            'score' => '10.0000',
            'verified_xp_total' => 10,
            'active_member_denominator' => 2,
            'cohort_size' => 2,
            'suppressed' => true,
            'suppression_reason' => 'cohort_below_minimum',
        ],
    ] as $index => $row) {
        LeaderboardProjection::factory()
            ->for($period, 'period')
            ->for($institution)
            ->create(array_merge($row, [
                'scope_type' => LeaderboardScopeType::Program,
                'snapshot_digest' => $digest,
                'snapshot_key' => hash('sha256', $digest.'|'.$row['scope_key'].'|'.$index),
            ]));
    }

    return compact('institution', 'user', 'semester');
}
