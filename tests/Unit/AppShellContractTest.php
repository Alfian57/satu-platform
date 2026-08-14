<?php

function appShellProjectFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

test('uses only implemented Wayfinder destinations in primary navigation', function () {
    $sidebar = appShellProjectFile('resources/js/components/app-sidebar.tsx');

    expect($sidebar)
        ->toContain("import { dashboard } from '@/routes';")
        ->toContain('href: dashboard()')
        ->not->toContain('href="/dashboard"')
        ->not->toContain('Repository')
        ->not->toContain('Documentation')
        ->not->toContain('react-starter-kit')
        ->not->toContain('Temukan Project')
        ->not->toContain('Kontribusi')
        ->toContain("title: 'Portofolio'")
        ->not->toContain("title: 'Portfolio'");
});

test('uses the dedicated shell for student workspace pages only', function () {
    $app = appShellProjectFile('resources/js/app.tsx');
    $layout = appShellProjectFile('resources/js/layouts/student-layout.tsx');
    $sidebar = appShellProjectFile('resources/js/components/student-sidebar.tsx');

    expect($app)
        ->toContain("import StudentLayout from '@/layouts/student-layout';")
        ->toContain('function isStudentPage')
        ->toContain("'dashboard'")
        ->toContain("'projects/'")
        ->toContain("'contributions/'")
        ->toContain("'portfolio/'")
        ->toContain("'leaderboards/'")
        ->toContain('return StudentLayout;');

    expect($layout)
        ->toContain("auth.user?.workspace.role !== 'student'")
        ->toContain('<StudentSidebar />')
        ->toContain('<StudentHeader breadcrumbs={breadcrumbs} />');

    expect($sidebar)
        ->toContain('aria-label="Navigasi mahasiswa"')
        ->toContain('href: dashboard()')
        ->toContain('href: projectsIndex()')
        ->toContain('href: contributionsIndex()')
        ->toContain('href: portfolioIndex()')
        ->toContain('href: leaderboardsIndex()')
        ->toContain('prefetch')
        ->not->toContain('href="/dashboard"');
});

test('keeps app workspace pages inside the global shell exactly once', function () {
    $workspacePages = [
        'resources/js/pages/campus/credit-mappings.tsx',
        'resources/js/pages/campus/inclusion.tsx',
        'resources/js/pages/campus/overview.tsx',
        'resources/js/pages/talent/candidate-detail.tsx',
        'resources/js/pages/talent/contact-requests.tsx',
        'resources/js/pages/talent/saved.tsx',
        'resources/js/pages/talent/search.tsx',
    ];

    foreach ($workspacePages as $path) {
        expect(appShellProjectFile($path))
            ->not->toContain("import AppLayout from '@/layouts/app-layout';")
            ->not->toContain('<AppLayout>');
    }

    expect(appShellProjectFile('resources/js/pages/campus/overview.tsx'))
        ->not->toContain('useTransition')
        ->toContain('onFinish: () => setIsPending(false)');
});

test('keeps inactive student navigation steady when hovered', function () {
    $sidebar = appShellProjectFile('resources/js/components/student-sidebar.tsx');
    $studentNavigation = strstr($sidebar, 'function StudentNav()');

    if ($studentNavigation === false) {
        throw new RuntimeException('Unable to read the student navigation.');
    }

    $studentNavigation = strstr(
        $studentNavigation,
        'function InstitutionContext',
        true,
    );

    if ($studentNavigation === false) {
        throw new RuntimeException('Unable to isolate the student navigation.');
    }

    expect($studentNavigation)
        ->toContain(": 'text-slate-600',")
        ->toContain(": 'bg-slate-100 text-slate-500',")
        ->not->toContain('hover:bg-blue-50')
        ->not->toContain('hover:text-blue-700')
        ->not->toContain('group-hover:bg-blue-100')
        ->not->toContain('group-hover:text-blue-700');
});

test('uses the student sidebar treatment for privileged workspaces', function () {
    $sidebar = appShellProjectFile('resources/js/components/app-sidebar.tsx');
    $navigation = appShellProjectFile('resources/js/components/nav-main.tsx');

    expect($sidebar)
        ->toContain('className="border-r border-slate-200 bg-white text-slate-950"')
        ->toContain('className="border-b border-slate-200 px-6 py-7"')
        ->toContain('className="border-t border-slate-200 p-4"')
        ->toContain('className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"')
        ->toContain("'Navigasi admin platform'")
        ->toContain("'Navigasi operator kampus'")
        ->toContain("'Navigasi perekrut'");

    expect($navigation)
        ->toContain('const { isCurrentOrParentUrl } = useCurrentUrl();')
        ->toContain('aria-label={ariaLabel}')
        ->toContain('grid gap-1.5')
        ->toContain('cursor-pointer')
        ->toContain('bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-950/25')
        ->toContain("'bg-slate-100 text-slate-500'");
});

test('uses one continuous background gradient for the student dashboard', function () {
    $dashboard = appShellProjectFile('resources/js/pages/dashboard.tsx');
    $layout = appShellProjectFile('resources/js/layouts/student-layout.tsx');

    expect($layout)->toContain(
        'bg-linear-to-b from-blue-50 from-0% via-[#f5f8fe] via-35% to-slate-50 to-100%',
    );

    expect($dashboard)->not->toContain('radial-gradient(ellipse_76%_42%');
});

test('exposes accessible navigation and mobile drawer behavior', function () {
    $header = appShellProjectFile('resources/js/components/app-header.tsx');
    $navigation = appShellProjectFile('resources/js/components/nav-main.tsx');
    $sidebarPrimitive = appShellProjectFile(
        'resources/js/components/ui/sidebar.tsx',
    );

    expect($header)
        ->toContain('<SidebarTrigger')
        ->not->toContain('ThemeToggle')
        ->toContain('<NavUser />');

    expect($navigation)
        ->toContain('aria-label={ariaLabel}')
        ->toContain("aria-current={isActive ? 'page' : undefined}")
        ->toContain('setOpenMobile(false)')
        ->toContain('prefetch');

    expect($sidebarPrimitive)
        ->toContain('<SheetTitle>Navigasi SATU</SheetTitle>')
        ->toContain('aria-label={label}')
        ->toContain('Buka atau tutup navigasi');
});

test('requires an accessible label when a context rail is rendered', function () {
    $page = appShellProjectFile('resources/js/components/app-page.tsx');

    expect($page)
        ->toContain('data-slot="app-page"')
        ->toContain('flex-1')
        ->toContain('contextRail: ReactNode;')
        ->toContain('contextRailLabel: string;')
        ->toContain('<aside')
        ->toContain('aria-label={contextRailLabel}')
        ->toContain('xl:border-l');
});

test('keeps the authenticated shell in the light appearance', function () {
    $blade = appShellProjectFile('resources/views/app.blade.php');
    $app = appShellProjectFile('resources/js/app.tsx');

    expect($blade)
        ->toContain('color-scheme: light')
        ->not->toContain('html.dark')
        ->not->toContain('prefers-color-scheme');

    expect($app)->not->toContain('initializeTheme');
});

test('removes the Laravel starter identity from the authenticated shell', function () {
    $logo = appShellProjectFile('resources/js/components/app-logo.tsx');
    $userMenu = appShellProjectFile(
        'resources/js/components/user-menu-content.tsx',
    );

    expect($logo)
        ->toContain('Sistem Aktivitas Talenta Universitas')
        ->not->toContain('<svg');

    expect($userMenu)
        ->toContain('Pengaturan akun')
        ->toContain('Keluar');
});
