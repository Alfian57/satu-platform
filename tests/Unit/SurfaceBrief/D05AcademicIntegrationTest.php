<?php

function d05IntegrationBriefContent(): string
{
    $path = dirname(__DIR__, 3).'/.impeccable/surfaces/route-campus-integrations.md';
    $contents = file_get_contents($path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

test('YAML frontmatter has required fields', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)->toContain('version: 2');
    expect($brief)->toContain('slug: "route-campus-integrations"');
    expect($brief)->toContain('primary_target: "route:/campus/integrations"');
    expect($brief)->toContain('related_targets:');
    expect($brief)->toContain('"route:/campus/integrations/mappings"');
    expect($brief)->toContain('"route:/campus/integrations/syncs"');
    expect($brief)->toContain('"route:/campus"');
});

test('distinguishes sandbox and production connection clearly', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Sandbox')
        ->toContain('Production')
        ->toContain('Sandbox connected')
        ->toContain('Production connected')
        ->toContain('tidak direndahkan')
        ->toContain('data synthetic')
        ->toContain('Sandbox connection');
});

test('documents mapping lifecycle states completely', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Draft')
        ->toContain('Active')
        ->toContain('Retired')
        ->toContain('Duplicate prevention')
        ->toContain('tidak akan menduplikasi');
});

test('documents sync error, retry, and terminal states completely', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Queued')
        ->toContain('Sending')
        ->toContain('Succeeded')
        ->toContain('Failed')
        ->toContain('Retrying')
        ->toContain('Dead')
        ->toContain('Timeout')
        ->toContain('Validation error')
        ->toContain('Conflict')
        ->toContain('Reconciled')
        ->toContain('idempotency');
});

test('documents connection states completely', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Disconnected')
        ->toContain('Sandbox connected')
        ->toContain('Production connected')
        ->toContain('Degraded');
});

test('documents dense table with mobile reflow behavior', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Desktop')
        ->toContain('Tablet')
        ->toContain('Mobile (320px)')
        ->toContain('dense ruled table')
        ->toContain('stacked labeled rows')
        ->toContain('tanpa horizontal overflow');
});

test('documents keyboard navigation and confirmation requirements', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Keyboard')
        ->toContain('Tab')
        ->toContain('Enter atau Space')
        ->toContain('confirmation dialog')
        ->toContain('trap fokus')
        ->toContain('Escape')
        ->toContain('Confirmation')
        ->toContain('Retry sync')
        ->toContain('Retire mapping')
        ->toContain('Connect production');
});

test('documents status semantics beyond color', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Color Is Never Alone')
        ->toContain('Icon atau mark yang konsisten')
        ->toContain('Label teks dalam bahasa Indonesia')
        ->toContain('grayscale')
        ->toContain('screen reader')
        ->toContain('Verified Mark')
        ->toContain('Pending Review')
        ->toContain('Correction Required');
});

test('references LOADING_STATES.md with region-level loading contract', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('[LOADING_STATES.md](../../docs/ux/LOADING_STATES.md)')
        ->toContain('aria-busy="true"')
        ->toContain('role="status"')
        ->toContain('Memuat data integrasi kampus')
        ->toContain('Initial page load')
        ->toContain('Deferred region')
        ->toContain('Pagination dan refresh')
        ->toContain('Processing action');
});

test('documents all required state transitions', function () {
    $brief = d05IntegrationBriefContent();

    foreach ([
        'loading -> success',
        'loading -> empty',
        'loading -> error',
        'loading -> forbidden',
        'loading -> stale',
    ] as $transition) {
        expect($brief)->toContain($transition);
    }
});

test('documents empty, error, forbidden, stale, and partial-data states', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Empty state')
        ->toContain('Error state')
        ->toContain('Forbidden')
        ->toContain('Stale')
        ->toContain('Partial data');
});

test('documents accessibility requirements', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('prefers-reduced-motion')
        ->toContain('Zoom 200%')
        ->toContain('dark mode')
        ->toContain('Keyboard order')
        ->toContain('visible focus');
});

test('does not contain Unicode em dash', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->not->toContain("\u{2014}");
});

test('does not contain stigmatizing labels as positive statements', function () {
    $brief = d05IntegrationBriefContent();

    $assertionFree = preg_replace('/^.*Istilah stigmatisasi.*$/m', '', $brief);

    expect($assertionFree)
        ->not->toMatch('/\brentan\b/i')
        ->not->toMatch('/\bterisolasi\b/i')
        ->not->toMatch('/\bmental\b/i')
        ->not->toMatch('/\bdiagnosis\b/i');
});

test('documents synthetic data labeling for sandbox', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Data synthetic')
        ->toContain('ditandai');
});

test('documents audit trail and idempotency', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('audit trail')
        ->toContain('idempotency')
        ->toContain('resolution timestamp');
});

test('documents retry confirmation with idempotency explanation', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('idempotency explanation')
        ->toContain('tidak akan menduplikasi')
        ->toContain('Mengirim ulang payload');
});

test('documents reconciliation as manual operator process', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Reconciled')
        ->toContain('resolution timestamp')
        ->toContain('manual process');
});

test('documents sandbox as baseline release with external gate for production', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Sandbox adalah baseline release')
        ->toContain('external gate')
        ->toContain('secret handling');
});

test('documents content ranges for minimum, typical, and maximum', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Minimum')
        ->toContain('Typical')
        ->toContain('Maximum')
        ->toContain('paginated');
});

test('documents Skeleton per region without decorative card or full-page replacement', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('skeleton')
        ->toContain('geometry')
        ->toContain('spacing')
        ->toContain('decorative card')
        ->toContain('full-page');
});

test('surface brief references canonical terminology from CONTENT_ACCESSIBILITY.md', function () {
    $brief = d05IntegrationBriefContent();

    expect($brief)
        ->toContain('Data synthetic');
});
