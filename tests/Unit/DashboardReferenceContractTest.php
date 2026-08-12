<?php

function dashboardProjectFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

test('dashboard reads server application props instead of a client fixture', function () {
    $page = dashboardProjectFile('resources/js/pages/dashboard.tsx');
    $types = dashboardProjectFile('resources/js/types/dashboard.ts');

    expect(file_exists(dirname(__DIR__, 2).'/resources/js/lib/dashboard-reference-data.ts'))
        ->toBeFalse();

    expect($page)
        ->toContain('usePage<DashboardPageProps>()')
        ->toContain('data-dashboard-source="application"')
        ->toContain('<Deferred')
        ->not->toContain('dashboardReference')
        ->not->toContain('Data demo sintetis')
        ->not->toContain('window.location');

    expect($types)
        ->toContain('DashboardPageProps')
        ->toContain('DashboardRecommendation')
        ->toContain('DashboardAction');
});

test('dashboard keeps the approved docket, ledger, and context rail composition', function () {
    $page = dashboardProjectFile('resources/js/pages/dashboard.tsx');
    $docket = dashboardProjectFile(
        'resources/js/components/dashboard-next-action.tsx',
    );
    $ledger = dashboardProjectFile(
        'resources/js/components/dashboard-project-ledger.tsx',
    );
    $rail = dashboardProjectFile(
        'resources/js/components/dashboard-context-rail.tsx',
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
        ->toContain('<time dateTime={fact.dateTime}>');

    expect($ledger)
        ->toContain('<ol')
        ->toContain('aria-labelledby="active-projects-heading"')
        ->toContain('{project.nextTask}')
        ->toContain('<time dateTime={project.deadlineIso}>')
        ->toContain('md:hidden')
        ->not->toContain('truncate');

    expect($rail)
        ->toContain('aria-labelledby="review-queue-heading"')
        ->toContain('aria-labelledby="recommendation-heading"')
        ->toContain('recommendation.reasons.map')
        ->toContain('dashboard-recommendation-hide')
        ->toContain('dashboard-recommendation-not-relevant');
});

test('dashboard loading and interaction states honor accessibility contracts', function () {
    $skeleton = dashboardProjectFile(
        'resources/js/components/ui/skeleton.tsx',
    );
    $docket = dashboardProjectFile(
        'resources/js/components/dashboard-next-action.tsx',
    );
    $ledger = dashboardProjectFile(
        'resources/js/components/dashboard-project-ledger.tsx',
    );
    $rail = dashboardProjectFile(
        'resources/js/components/dashboard-context-rail.tsx',
    );

    expect($skeleton)->toContain('motion-reduce:animate-none');
    expect($ledger)
        ->toContain('aria-busy="true"')
        ->toContain('role="status"')
        ->toContain('motion-reduce');
    expect($rail)
        ->toContain('aria-busy="true"')
        ->toContain('role="status"')
        ->toContain('motion-reduce');
    expect($docket)->not->toContain('animate-');
});

test('dashboard copy and recommendation actions keep the privacy boundary', function () {
    $files = [
        dashboardProjectFile('resources/js/pages/dashboard.tsx'),
        dashboardProjectFile(
            'resources/js/components/dashboard-context-rail.tsx',
        ),
        dashboardProjectFile(
            'resources/js/components/dashboard-next-action.tsx',
        ),
    ];

    foreach ($files as $file) {
        expect($file)
            ->not->toContain('connectivity_opportunity')
            ->not->toContain('inclusion')
            ->not->toContain("\u{2014}");
    }

    expect($files[1])
        ->toContain('Perbarui profil')
        ->toContain('Sembunyikan')
        ->toContain('Tidak relevan');
});
