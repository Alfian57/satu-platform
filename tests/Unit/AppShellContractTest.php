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
        ->toContain('href={dashboard()}')
        ->not->toContain('href="/dashboard"')
        ->not->toContain('Repository')
        ->not->toContain('Documentation')
        ->not->toContain('react-starter-kit')
        ->not->toContain('Temukan Project')
        ->not->toContain('Kontribusi')
        ->not->toContain('Portofolio');
});

test('exposes accessible navigation and mobile drawer behavior', function () {
    $header = appShellProjectFile('resources/js/components/app-header.tsx');
    $navigation = appShellProjectFile('resources/js/components/nav-main.tsx');
    $sidebarPrimitive = appShellProjectFile(
        'resources/js/components/ui/sidebar.tsx',
    );

    expect($header)
        ->toContain('<SidebarTrigger')
        ->toContain('<ThemeToggle />')
        ->toContain('<NavUser />');

    expect($navigation)
        ->toContain('aria-label="Navigasi utama"')
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

test('provides a binary theme shortcut in the authenticated navbar', function () {
    $toggle = appShellProjectFile(
        'resources/js/components/theme-toggle.tsx',
    );

    expect($toggle)
        ->toContain('const resolvedNextAppearance =')
        ->toContain("resolvedAppearance === 'dark'")
        ->toContain("? 'light'")
        ->toContain(": 'dark'")
        ->toContain('useSyncExternalStore(')
        ->toContain('Aktifkan mode terang')
        ->toContain('Aktifkan mode gelap')
        ->toContain('updateAppearance(nextAppearance)')
        ->toContain('data-test="theme-toggle"')
        ->toContain('min-h-control-lg')
        ->toContain('min-w-control-lg');
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
