<?php

function dashboardReferenceProjectFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

test('defines the complete client-only dashboard state matrix with a safe fallback', function () {
    $types = dashboardReferenceProjectFile(
        'resources/js/types/dashboard.ts',
    );
    $fixture = dashboardReferenceProjectFile(
        'resources/js/lib/dashboard-reference-data.ts',
    );
    $page = dashboardReferenceProjectFile('resources/js/pages/dashboard.tsx');

    foreach ([
        'revision',
        'first-run',
        'empty',
        'loading',
        'long-content',
        'partial-permission',
        'error',
        'stale',
    ] as $state) {
        expect($types)->toContain("'{$state}'");
        expect($fixture)->toContain("state: '{$state}'");
    }

    expect($fixture)
        ->toContain('export function resolveDashboardReferenceState(')
        ->toContain("return 'revision';")
        ->toContain('new URLSearchParams(query)')
        ->toContain('satisfies DashboardReferenceScenario');

    expect($page)
        ->toContain('resolveDashboardReferenceState(page.url)')
        ->toContain('dashboardReferenceScenarios[referenceState]')
        ->toContain('data-dashboard-state={referenceState}')
        ->not->toContain('dashboard:');
});

test('marks every reference dashboard state as synthetic', function () {
    $fixture = dashboardReferenceProjectFile(
        'resources/js/lib/dashboard-reference-data.ts',
    );
    $page = dashboardReferenceProjectFile('resources/js/pages/dashboard.tsx');

    expect(substr_count($fixture, "source: 'synthetic'"))
        ->toBe(8);

    expect($fixture)
        ->toContain('Data demo sintetis. Ini bukan aktivitas akun Anda.')
        ->toContain("label: 'Direview oleh'")
        ->toContain("reference: 'REV-024'")
        ->toContain("title: 'Lengkapi bukti kontribusi'")
        ->toContain("value: 'Nadia Putri'")
        ->toContain("title: 'Desain sistem informasi relawan'");

    expect($page)
        ->toContain('data-dashboard-source={scenario.source}')
        ->toContain('{scenario.syntheticLabel}');
});

test('keeps the docket first composition across responsive states', function () {
    $page = dashboardReferenceProjectFile('resources/js/pages/dashboard.tsx');
    $docket = dashboardReferenceProjectFile(
        'resources/js/components/dashboard-next-action.tsx',
    );
    $ledger = dashboardReferenceProjectFile(
        'resources/js/components/dashboard-project-ledger.tsx',
    );

    expect($page)
        ->toContain('<DashboardNextAction')
        ->toContain('<DashboardProjectLedger')
        ->toContain('contextRail={')
        ->toContain('<DashboardContextRail')
        ->not->toContain('PlaceholderPattern')
        ->not->toContain('md:grid-cols-3');

    expect($docket)
        ->toContain('<dl>')
        ->toContain('aria-labelledby="dashboard-next-action"')
        ->toContain('{action.statusLabel}')
        ->toContain('<time dateTime={fact.dateTime}>')
        ->toContain('sm:grid-cols-[7.5rem_minmax(0,1fr)]');

    expect($ledger)
        ->toContain('<ol')
        ->toContain('aria-labelledby="active-projects-heading"')
        ->toContain('{project.nextTask}')
        ->toContain('<time dateTime={project.deadlineIso}>')
        ->toContain('md:hidden')
        ->not->toContain('truncate');
});

test('uses the canonical Project label and wraps long content', function () {
    $files = [
        dashboardReferenceProjectFile(
            'resources/js/lib/dashboard-reference-data.ts',
        ),
        dashboardReferenceProjectFile(
            'resources/js/components/dashboard-next-action.tsx',
        ),
        dashboardReferenceProjectFile(
            'resources/js/components/dashboard-project-ledger.tsx',
        ),
        dashboardReferenceProjectFile(
            'resources/js/components/dashboard-context-rail.tsx',
        ),
    ];

    foreach ($files as $file) {
        expect($file)
            ->not->toContain('Proyek')
            ->not->toContain('truncate');
    }

    expect($files[0])
        ->toContain("label: 'Project'")
        ->toContain('totalCount: 12')
        ->toContain('remainingActionLabel:');

    expect($files[2])
        ->toContain('Project aktif')
        ->toContain('wrap-anywhere');
});

test('keeps loading and interaction motion safe for reduced motion users', function () {
    $skeleton = dashboardReferenceProjectFile(
        'resources/js/components/ui/skeleton.tsx',
    );
    $docket = dashboardReferenceProjectFile(
        'resources/js/components/dashboard-next-action.tsx',
    );
    $ledger = dashboardReferenceProjectFile(
        'resources/js/components/dashboard-project-ledger.tsx',
    );

    expect($skeleton)->toContain('motion-reduce:animate-none');
    expect($ledger)->toContain('motion-reduce:transition-none');
    expect($docket)->not->toContain('animate-');
});

test('keeps synthetic actions honest and free of hardcoded destinations', function () {
    $files = [
        dashboardReferenceProjectFile('resources/js/pages/dashboard.tsx'),
        dashboardReferenceProjectFile(
            'resources/js/components/dashboard-next-action.tsx',
        ),
        dashboardReferenceProjectFile(
            'resources/js/components/dashboard-project-ledger.tsx',
        ),
        dashboardReferenceProjectFile(
            'resources/js/components/dashboard-context-rail.tsx',
        ),
        dashboardReferenceProjectFile(
            'resources/js/components/dashboard-state-notice.tsx',
        ),
    ];

    expect($files[0])
        ->toContain("toast.info('Data demo sintetis'")
        ->toContain('belum terhubung ke fitur aplikasi pada fase ini.');

    foreach ($files as $file) {
        expect($file)
            ->not->toMatch('/href=[\"\']\//')
            ->not->toContain('window.location');
    }
});

test('explains edge states without sensitive inference', function () {
    $fixture = dashboardReferenceProjectFile(
        'resources/js/lib/dashboard-reference-data.ts',
    );
    $rail = dashboardReferenceProjectFile(
        'resources/js/components/dashboard-context-rail.tsx',
    );

    expect($fixture)
        ->toContain('Riset pengguna dibutuhkan')
        ->toContain('Afiliasi kampus sedang ditinjau')
        ->toContain('Data profilmu tetap aman')
        ->toContain('Ada perubahan terbaru')
        ->not->toMatch('/\bterisolasi\b/i')
        ->not->toMatch('/\brentan\b/i')
        ->not->toMatch('/\bmental\b/i');

    expect($rail)
        ->toContain('aria-labelledby="review-queue-heading"')
        ->toContain('aria-labelledby="recommendation-heading"')
        ->toContain('recommendation.reasons.map')
        ->toContain('aria-live="polite"')
        ->toContain('{reviewQueue.statusLabel}');
});

test('keeps dashboard metadata and evidence affordances semantically honest', function () {
    $ledger = dashboardReferenceProjectFile(
        'resources/js/components/dashboard-project-ledger.tsx',
    );
    $rail = dashboardReferenceProjectFile(
        'resources/js/components/dashboard-context-rail.tsx',
    );
    $notice = dashboardReferenceProjectFile(
        'resources/js/components/dashboard-state-notice.tsx',
    );
    $docket = dashboardReferenceProjectFile(
        'resources/js/components/dashboard-next-action.tsx',
    );

    expect($ledger)
        ->toContain("region.state === 'empty'")
        ->toContain('totalCount !== undefined')
        ->toContain('data-test="dashboard-project-count"')
        ->toContain('sm:grid-cols-[4.75rem_minmax(0,1fr)]')
        ->not->toContain('text-[0.6875rem]');

    expect($rail)
        ->toContain('data-test="dashboard-recommendation-marker"')
        ->toContain('rounded-full bg-accent text-primary')
        ->not->toContain('aria-checked');

    expect($notice)
        ->toContain("notice.tone === 'error' ? undefined : 'polite'")
        ->not->toContain('text-[0.6875rem]');

    expect($docket)->not->toContain('text-[0.6875rem]');
});
