<?php

function leaderboardBriefContent(): string
{
    $path = dirname(__DIR__, 3).'/.impeccable/surfaces/route-leaderboards.md';
    $contents = file_get_contents($path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

test('YAML frontmatter has required fields', function () {
    $brief = leaderboardBriefContent();

    expect($brief)->toContain('version: 2');
    expect($brief)->toContain("slug: 'route-leaderboards'");
    expect($brief)->toContain("primary_target: 'route:/leaderboards'");
    expect($brief)->toContain('related_targets:');
    expect($brief)->toContain('route:/dashboard');
    expect($brief)->toContain('route:/campus');
});

test('documents program/team default and individual opt-in behavior', function () {
    $brief = leaderboardBriefContent();

    expect($brief)
        ->toContain('tampil secara default')
        ->toContain('opt-in eksplisit')
        ->toContain('Individual leaderboard default off')
        ->toContain('preview data dan consequence')
        ->toContain('dapat dicabut kapan saja')
        ->not->toContain('auto-enroll')
        ->not->toContain("\u{2014}");
});

test('covers period, denominator, tie, suppression, stale, withdrawal, and explanation states', function () {
    $brief = leaderboardBriefContent();

    expect($brief)->toContain('dalam semester berjalan');
    expect($brief)->toContain('rata-rata verified XP per active member per semester');
    expect($brief)->toContain('standard competition ranking');
    expect($brief)->toContain('Suppressed cohort');
    expect($brief)->toContain('Stale projection');
    expect($brief)->toContain('Withdrawn');
    expect($brief)->toContain('Explanation drawer');
    expect($brief)->toContain('denominator');
    expect($brief)->toContain('No verified XP');
    expect($brief)->toContain('Tied rank');
    expect($brief)->toContain('Individual opt-out');
});

test('covers table equivalent, reduced motion, and non-color status', function () {
    $brief = leaderboardBriefContent();

    expect($brief)
        ->toContain('<table>')
        ->toContain('<caption>')
        ->toContain('scope')
        ->toContain('prefers-reduced-motion')
        ->toContain('dinonaktifkan sepenuhnya pada reduced motion')
        ->toContain('tanpa persepsi warna')
        ->toContain('Verified Mark icon dan label teks')
        ->toContain('teks penyebab dan jumlah anggota')
        ->toContain('teks "Peringkat sama"')
        ->toContain('tabular numeral alignment');
});

test('references LOADING_STATES.md with region-level loading contract', function () {
    $brief = leaderboardBriefContent();

    expect($brief)
        ->toContain('[LOADING_STATES.md](../../docs/ux/LOADING_STATES.md)')
        ->toContain('aria-busy="true"')
        ->toContain('role="status"')
        ->toContain('Memuat papan peringkat')
        ->toContain('Initial page load')
        ->toContain('Deferred region')
        ->toContain('Pagination dan refresh')
        ->toContain('Explanation drawer loading')
        ->toContain('Processing command')
        ->toContain('Empty state')
        ->toContain('Error dan forbidden')
        ->toContain('Stale')
        ->toContain('Reduced motion');
});

test('defines responsive behavior from mobile to desktop', function () {
    $brief = leaderboardBriefContent();

    expect($brief)
        ->toContain('Desktop: table dengan ruled rows')
        ->toContain('Tablet: table dengan horizontal scroll')
        ->toContain('Mobile (320px): stacked labeled rows tanpa horizontal overflow');
});

test('keeps leaderboard as supporting surface, not dominant motivation', function () {
    $brief = leaderboardBriefContent();

    expect($brief)
        ->toContain('supporting evidence')
        ->toContain('bukan pusat identitas visual')
        ->toContain('tanpa podium neon')
        ->toContain('confetti')
        ->not->toContain('terisolasi')
        ->not->toContain('rentan')
        ->not->toContain('mental');
});

test('excludes inclusion and connectivity from leaderboard score', function () {
    $brief = leaderboardBriefContent();

    expect($brief)
        ->toContain('Inclusion signal')
        ->toContain('bukan input score')
        ->toContain('tidak memengaruhi ranking');
});
