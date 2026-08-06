<?php

function campusBriefContent(): string
{
    $path = dirname(__DIR__, 3).'/.impeccable/surfaces/route-campus.md';
    $contents = file_get_contents($path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

function platformBriefContent(): string
{
    $path = dirname(__DIR__, 3).'/.impeccable/surfaces/route-platform.md';
    $contents = file_get_contents($path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

// --- route-campus YAML frontmatter ---

test('route-campus YAML frontmatter has required fields', function () {
    $brief = campusBriefContent();

    expect($brief)->toContain('version: 3');
    expect($brief)->toContain("slug: 'route-campus'");
    expect($brief)->toContain("primary_target: 'route:/campus'");
    expect($brief)->toContain('related_targets:');
    expect($brief)->toContain('route:/campus/affiliations');
    expect($brief)->toContain('route:/campus/contributions');
    expect($brief)->toContain('route:/campus/integrations');
});

// --- route-campus queue volume ---

test('route-campus defines minimum, typical, and maximum queue volume', function () {
    $brief = campusBriefContent();

    expect($brief)->toContain('kosong (0 item)');
    expect($brief)->toContain('20-100 item');
    expect($brief)->toContain('10.000 item');
    expect($brief)->toContain('dipaginasi 50 per halaman');
    expect($brief)->toContain('Filter dan search tetap responsif');
});

// --- route-campus operational states ---

test('route-campus covers concurrent decision, provider failure, expired invitation, bulk safety, and audit consequence', function () {
    $brief = campusBriefContent();

    expect($brief)->toContain('dikunci (lock)');
    expect($brief)->toContain('sedang ditinjau oleh reviewer pertama');
    expect($brief)->toContain('timeout 30 menit');
    expect($brief)->toContain('Gagal terkirim');
    expect($brief)->toContain('Fonnte');
    expect($brief)->toContain('retry count');
    expect($brief)->toContain('Kirim ulang');
    expect($brief)->toContain('Kedaluwarsa');
    expect($brief)->toContain('72 jam');
    expect($brief)->toContain('Bulk selection: hanya untuk safe reversible operations');
    expect($brief)->toContain('append-only record');
    expect($brief)->toContain('reviewer identity');
    expect($brief)->toContain('policy version');
    expect($brief)->toContain('tidak dapat dihapus');
    expect($brief)->toContain('reference ke decision sebelumnya');
});

// --- route-campus entity states ---

test('route-campus covers affiliation, roster, contribution, and invitation states', function () {
    $brief = campusBriefContent();

    expect($brief)->toContain('pending exact match');
    expect($brief)->toContain('exact match sukses');
    expect($brief)->toContain('pending manual review');
    expect($brief)->toContain('NIM tidak ditemukan');
    expect($brief)->toContain('phone tidak cocok');
    expect($brief)->toContain('duplicate NIM');
    expect($brief)->toContain('revision required');
    expect($brief)->toContain('withdrawn by student');
    expect($brief)->toContain('delivery failed');
    expect($brief)->toContain('expired (72 jam');
    expect($brief)->toContain('accepted');
    expect($brief)->toContain('revoked');
});

// --- route-campus mobile and desktop behavior ---

test('route-campus defines mobile single-review and desktop dense-queue behavior', function () {
    $brief = campusBriefContent();

    expect($brief)->toContain('Satu item per viewport');
    expect($brief)->toContain('stacked labeled rows');
    expect($brief)->toContain('swipe gesture');
    expect($brief)->toContain('Decision docket mengambil seluruh viewport');
    expect($brief)->toContain('Dense ledger table');
    expect($brief)->toContain('gap-density-dense');
    expect($brief)->toContain('h-control-sm');
    expect($brief)->toContain('ruled rows');
    expect($brief)->toContain('sticky header');
    expect($brief)->toContain('panel samping');
    expect($brief)->toContain('queue tetap terlihat');
});

// --- route-campus loading contract ---

test('route-campus references LOADING_STATES.md with region-level loading contract', function () {
    $brief = campusBriefContent();

    expect($brief)
        ->toContain('[LOADING_STATES.md](../../docs/ux/LOADING_STATES.md)')
        ->toContain('aria-busy="true"')
        ->toContain('role="status"')
        ->toContain('Memuat antrean operasi kampus')
        ->toContain('Initial page load')
        ->toContain('Deferred region')
        ->toContain('Pagination dan refresh')
        ->toContain('Processing command')
        ->toContain('Empty state')
        ->toContain('Error dan forbidden')
        ->toContain('Stale')
        ->toContain('Reduced motion');
});

// --- route-campus content & accessibility ---

test('route-campus has semantic status cues beyond color and Indonesian copy', function () {
    $brief = campusBriefContent();

    expect($brief)
        ->toContain('icon dan teks')
        ->toContain('reason')
        ->not->toContain("\u{2014}")
        ->not->toContain('rentan')
        ->not->toContain('terisolasi')
        ->not->toContain('mental');
});

// --- route-platform YAML frontmatter ---

test('route-platform YAML frontmatter has required fields', function () {
    $brief = platformBriefContent();

    expect($brief)->toContain('version: 2');
    expect($brief)->toContain("slug: 'route-platform'");
    expect($brief)->toContain("primary_target: 'route:/platform'");
    expect($brief)->toContain('related_targets:');
    expect($brief)->toContain('route:/platform/institutions');
    expect($brief)->toContain('route:/platform/recruiters');
    expect($brief)->toContain('route:/campus');
});

// --- route-platform queue volume ---

test('route-platform defines minimum, typical, and maximum queue volumes per entity', function () {
    $brief = platformBriefContent();

    expect($brief)->toContain('Institution queue');
    expect($brief)->toContain('Invitation queue');
    expect($brief)->toContain('Recruiter queue');
    expect($brief)->toContain('Entitlement queue');
    expect($brief)->toContain('typical 3-15');
    expect($brief)->toContain('typical 5-30');
    expect($brief)->toContain('typical 2-10');
    expect($brief)->toContain('typical 3-20');
    expect($brief)->toContain('dipaginasi 50 per halaman');
    expect($brief)->toContain('minimum 0');
});

// --- route-platform operational states ---

test('route-platform covers concurrent decision, provider failure, expired invitation, bulk safety, and audit consequence', function () {
    $brief = platformBriefContent();

    expect($brief)->toContain('dikunci (lock)');
    expect($brief)->toContain('sedang ditinjau');
    expect($brief)->toContain('timeout 30 menit');
    expect($brief)->toContain('Concurrent rejection tidak dimungkinkan');
    expect($brief)->toContain('Gagal terkirim');
    expect($brief)->toContain('Fonnte');
    expect($brief)->toContain('retry count');
    expect($brief)->toContain('exponential backoff');
    expect($brief)->toContain('1m, 5m, 15m');
    expect($brief)->toContain('Kedaluwarsa');
    expect($brief)->toContain('72 jam');
    expect($brief)->toContain('Kirim ulang undangan');
    expect($brief)->toContain('bulk action hanya untuk safe operations');
    expect($brief)->toContain('append-only record');
    expect($brief)->toContain('actor identity');
    expect($brief)->toContain('policy version');
    expect($brief)->toContain('tidak dapat dihapus');
    expect($brief)->toContain('affected tenant ID');
});

// --- route-platform entity and provider states ---

test('route-platform covers institution, invitation, recruiter, entitlement, and provider states', function () {
    $brief = platformBriefContent();

    expect($brief)->toContain('pending review');
    expect($brief)->toContain('approved');
    expect($brief)->toContain('rejected');
    expect($brief)->toContain('suspended');
    expect($brief)->toContain('reactivation pending');
    expect($brief)->toContain('delivery failed');
    expect($brief)->toContain('rate limited');
    expect($brief)->toContain('invalid number');
    expect($brief)->toContain('recruiter organization');
    expect($brief)->toContain('pending verification');
    expect($brief)->toContain('entitlement');
    expect($brief)->toContain('scheduled');
    expect($brief)->toContain('expired');
    expect($brief)->toContain('revoked');
    expect($brief)->toContain('Provider degraded');
    expect($brief)->toContain('Fonnte health indicator');
    expect($brief)->toContain('success rate');
});

// --- route-platform mobile and desktop behavior ---

test('route-platform defines mobile single-review and desktop dense-queue behavior', function () {
    $brief = platformBriefContent();

    expect($brief)->toContain('Satu tab queue dengan stacked labeled rows');
    expect($brief)->toContain('decision docket full-viewport');
    expect($brief)->toContain('dense ledger table');
    expect($brief)->toContain('gap-density-dense');
    expect($brief)->toContain('h-control-sm');
    expect($brief)->toContain('ruled rows');
    expect($brief)->toContain('sticky header');
    expect($brief)->toContain('panel samping kanan');
    expect($brief)->toContain('queue tetap terlihat');
    expect($brief)->toContain('Blocked dan nearing-deadline');
    expect($brief)->toContain('Bulk operation disembunyikan pada mobile');
});

// --- route-platform loading contract ---

test('route-platform references LOADING_STATES.md with region-level loading contract', function () {
    $brief = platformBriefContent();

    expect($brief)
        ->toContain('[LOADING_STATES.md](../../docs/ux/LOADING_STATES.md)')
        ->toContain('aria-busy="true"')
        ->toContain('role="status"')
        ->toContain('Memuat antrean operasi platform')
        ->toContain('Initial page load')
        ->toContain('Deferred region')
        ->toContain('Pagination dan refresh')
        ->toContain('Processing command')
        ->toContain('Empty state')
        ->toContain('Error dan forbidden')
        ->toContain('Stale')
        ->toContain('Reduced motion');
});

// --- route-platform content & accessibility ---

test('route-platform has semantic status cues beyond color and Indonesian copy', function () {
    $brief = platformBriefContent();

    expect($brief)
        ->toContain('icon dan teks')
        ->toContain('reason wajib')
        ->not->toContain("\u{2014}")
        ->not->toContain('rentan')
        ->not->toContain('terisolasi')
        ->not->toContain('mental');
});

// --- cross-brief coherence ---

test('both briefs share consistent lock timeout, invitation expiry, and retry policy', function () {
    $campus = campusBriefContent();
    $platform = platformBriefContent();

    expect($campus)->toContain('timeout 30 menit');
    expect($platform)->toContain('timeout 30 menit');
    expect($campus)->toContain('72 jam');
    expect($platform)->toContain('72 jam');
    expect($campus)->toContain('Fonnte');
    expect($platform)->toContain('Fonnte');
});

test('both briefs share append-only audit, reversal pattern, and queue-visible decision docket', function () {
    $campus = campusBriefContent();
    $platform = platformBriefContent();

    expect($campus)->toContain('append-only');
    expect($platform)->toContain('append-only');
    expect($campus)->toContain('reference ke decision sebelumnya');
    expect($platform)->toContain('reference ke decision sebelumnya');
    expect($campus)->toContain('queue tetap terlihat');
    expect($platform)->toContain('queue tetap terlihat');
});
