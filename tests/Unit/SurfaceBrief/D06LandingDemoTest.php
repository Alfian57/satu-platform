<?php

function d06LandingDemoProjectFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 3).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

function d06LandingDemoFrontmatter(string $brief): array
{
    $brief = ltrim($brief);
    if (! str_starts_with($brief, '---')) {
        return [];
    }

    $end = strpos($brief, '---', 3);
    if ($end === false) {
        return [];
    }

    $yamlRaw = substr($brief, 3, $end - 3);

    return array_filter(array_map('trim', explode("\n", $yamlRaw)));
}

test('surface brief YAML frontmatter has required fields', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)->toContain('version: 2');
    expect($brief)->toContain("slug: 'route'");
    expect($brief)->toContain("primary_target: 'route:/'");
    expect($brief)->toContain('route:/register');
    expect($brief)->toContain('route:/login');
});

test('surface brief documents first viewport direction', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('First viewport');
});

test('surface brief documents role value for each audience segment', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)->toContain('Student');
    expect($brief)->toContain('Campus leader');
    expect($brief)->toContain('Recruiter');
    expect($brief)->toContain('Competition evaluator');
    expect($brief)->toContain('Nilai:');
});

test('surface brief documents synthetic graph behavior', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('synthetic graph')
        ->toContain('Data synthetic');
});

test('surface brief documents privacy proof', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('Privacy proof')
        ->toContain('username')
        ->toContain('phone');
});

test('surface brief documents CTA per role', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('CTA')
        ->toContain('role-specific CTA');
});

test('surface brief covers No-JS fallback', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('No-JavaScript');
});

test('surface brief covers reduced motion', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('Reduced motion')
        ->toContain('prefers-reduced-motion');
});

test('surface brief covers keyboard and table alternative', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('Keyboard')
        ->toContain('table equivalent');
});

test('surface brief covers loading states per LOADING_STATES.md contract', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('Initial page load')
        ->toContain('Deferred region')
        ->toContain('Refresh dan reset')
        ->toContain('Processing action')
        ->toContain('Error dan recovery')
        ->toContain('Empty state')
        ->toContain('Reduced motion');
});

test('surface brief covers performance boundary', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('Core Web Vitals')
        ->toContain('LCP')
        ->toContain('INP')
        ->toContain('CLS')
        ->toMatch('/\basset\s+budget\b/i');
});

test('surface brief references LOADING_STATES.md', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('LOADING_STATES.md');
});

test('surface brief references Skeleton component from LOADING_STATES.md contract', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('skeleton.tsx')
        ->toContain('aria-busy')
        ->toContain('aria-live');
});

test('surface brief explicitly excludes invented customer, price, testimonial, partner, and impact claims', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('Tidak mencakup')
        ->toContain('invented customer')
        ->toContain('price')
        ->toContain('testimonial')
        ->toContain('pilot statistic')
        ->toContain('impact result')
        ->toContain('partner logo');
});

test('surface brief does not contain invented customer claims as positive statements', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    $assertionFree = preg_replace('/^.*Tidak mencakup.*$/m', '', $brief);

    expect($assertionFree)
        ->not->toMatch('/\bpelanggan\b/i')
        ->not->toMatch('/\bcustomer\b/i')
        ->not->toMatch('/\bclient\b/i');
});

test('surface brief does not contain invented price claims as positive statements', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    $assertionFree = preg_replace('/^.*Tidak mencakup.*$/m', '', $brief);

    expect($assertionFree)
        ->not->toMatch('/\bharga\b/i')
        ->not->toMatch('/\bprice\b/i')
        ->not->toMatch('/\bpricing\b/i')
        ->not->toMatch('/\bbilling\b/i')
        ->not->toMatch('/\bbayar\b/i')
        ->not->toMatch('/\bRp\s*\d/i')
        ->not->toMatch('/\$\s*\d/i');
});

test('surface brief does not contain invented testimonial claims as positive statements', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    $assertionFree = preg_replace('/^.*Tidak mencakup.*$/m', '', $brief);

    expect($assertionFree)
        ->not->toMatch('/\btestimoni\b/i')
        ->not->toMatch('/\btestimonial\b/i')
        ->not->toMatch('/\bkata mereka\b/i')
        ->not->toMatch('/\bwhat they say\b/i');
});

test('surface brief does not contain invented partner claims as positive statements', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    $assertionFree = preg_replace('/^.*Tidak mencakup.*$/m', '', $brief);

    expect($assertionFree)
        ->not->toMatch('/\bpartner\b/i')
        ->not->toMatch('/\bmitra\b/i')
        ->not->toMatch('/\belah bekerja sama\b/i')
        ->not->toMatch('/\bdipercaya oleh\b/i')
        ->not->toMatch('/\btrusted by\b/i');
});

test('surface brief does not contain invented impact result claims as positive statements', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    $assertionFree = preg_replace('/^.*Tidak mencakup.*$/m', '', $brief);

    expect($assertionFree)
        ->not->toMatch('/\bdampak\b/i')
        ->not->toMatch('/\bimpact\b/i')
        ->not->toMatch('/\bhasil\b/i')
        ->not->toMatch('/\bresult\b/i')
        ->not->toMatch('/\bpilot\b/i')
        ->not->toMatch('/\bterbukti\b/i');
});

test('surface brief does not contain stigmatizing labels as claims', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    $noConstraints = preg_replace(
        '/^.*Graph tidak boleh menampilkan.*$/m',
        '',
        $brief,
    );

    expect($noConstraints)
        ->not->toMatch('/\brentan\b/i')
        ->not->toMatch('/\bterisolasi\b/i')
        ->not->toMatch('/\bmental\b/i')
        ->not->toMatch('/\bdiagnosis\b/i');
});

test('surface brief does not contain Unicode em dash', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->not->toContain("\u{2014}");
});

test('surface brief documents all required state transitions', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    foreach ([
        'loading',
        'error',
        'empty',
        'stale',
        'reduced motion',
        'no-JavaScript',
    ] as $state) {
        expect(strtolower($brief))->toContain(strtolower($state));
    }
});

test('surface brief references canonical terminology from CONTENT_ACCESSIBILITY.md', function () {
    $brief = d06LandingDemoProjectFile('.impeccable/surfaces/route.md');

    expect($brief)
        ->toContain('Data synthetic');
});
