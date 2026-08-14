<?php

function landingSurfaceFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

test('landing page preserves the committed flow ledger direction', function () {
    $page = landingSurfaceFile('resources/js/pages/welcome.tsx');
    $ledger = landingSurfaceFile('resources/js/components/LandingFlowLedger.tsx');
    $styles = landingSurfaceFile('resources/css/app.css');

    expect($page)
        ->toContain('LandingFlowLedger')
        ->toContain('Flow ledger')
        ->toContain('landing-hero-illustration')
        ->toContain('landing-mascot-stage')
        ->toContain('landing-mascot-accessories.webp')
        ->toContain('landing-workflow-ledger')
        ->toContain('max-w-[110rem]')
        ->toContain('landing-page-canvas')
        ->toContain('landing-section-surface')
        ->toContain('synthetic')
        ->toContain('BATAS PROYEKSI')
        ->toContain('#cara-kerja')
        ->toContain('#privacy')
        ->toContain('landing-blue-hero')
        ->not->toContain('landing-hero-ledger')
        ->not->toContain('Maskot SATU')
        ->not->toContain('backdrop-blur');

    expect($styles)
        ->toContain('linear-gradient')
        ->toContain('satu-landing-blue-wash');

    expect($ledger)
        ->toContain('LANDING_STAGES')
        ->toContain('StageGlyph')
        ->toContain('aria-pressed')
        ->toContain('Visibilitas portofolio tetap dikendalikan mahasiswa.');
});

test('landing demo keeps a semantic equivalent for the interactive graph', function () {
    $graph = landingSurfaceFile('resources/js/components/LandingDemoGraph.tsx');

    expect($graph)
        ->toContain('TABLE EQUIVALENT')
        ->toContain('aria-describedby="graph-description"')
        ->toContain('Data synthetic / dapat direset')
        ->toContain('landing-demo-error')
        ->toContain('Coba lagi')
        ->toContain('prefers-reduced-motion')
        ->toContain('Tidak ada record pada filter ini.');
});

test('landing source uses the approved public route helpers', function () {
    $page = landingSurfaceFile('resources/js/pages/welcome.tsx');

    expect($page)
        ->toContain("import { dashboard, login, register } from '@/routes';")
        ->toContain('href={register()}')
        ->toContain('href={login()}')
        ->toContain('href={dashboard()}')
        ->not->toContain('href="/register"')
        ->not->toContain('href="/login"')
        ->not->toContain('href="/dashboard"');
});

test('example', function () {
    expect(true)->toBeTrue();
});
