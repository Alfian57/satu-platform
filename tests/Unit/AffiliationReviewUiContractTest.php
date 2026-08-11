<?php

function affiliationReviewUiFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

test('campus affiliation review uses deferred ledger and Wayfinder commands', function () {
    $page = affiliationReviewUiFile('resources/js/pages/campus/affiliations.tsx');

    expect($page)
        ->toContain("from '@/routes/campus/affiliations';")
        ->toContain("from '@/routes/campus/affiliations/decisions';")
        ->toContain("from '@/routes/campus/affiliations/locks';")
        ->toContain('<Deferred data="reviewQueue"')
        ->toContain('Array.from({ length: 10 }')
        ->toContain('aria-busy="true"')
        ->toContain('role="status"')
        ->toContain('data-test="affiliation-queue-skeleton"')
        ->toContain('data-test="affiliation-queue-row"')
        ->toContain('contextRailLabel="Ringkasan dan kendali antrean"')
        ->toContain('isQueueLoading ? (')
        ->toContain('onFinish: () => onQueueLoadingChange(false)')
        ->toContain('expected_version: selected.version')
        ->toContain('disabled:cursor-not-allowed')
        ->toContain('cursor-pointer')
        ->not->toContain('href="/')
        ->not->toContain('router.get(\'/')
        ->not->toContain("\u{2014}");
});

test('campus affiliation review includes distinct recovery and terminal states', function () {
    $page = affiliationReviewUiFile('resources/js/pages/campus/affiliations.tsx');

    expect($page)
        ->toContain('Tidak ada berkas pada filter ini')
        ->toContain('Berkas sudah berubah')
        ->toContain('Berkas sedang ditinjau')
        ->toContain('Perlu diajukan ulang')
        ->toContain('Memuat antrean afiliasi')
        ->toContain('Keputusan tersimpan')
        ->toContain('Muat ulang');
});
