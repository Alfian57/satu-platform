<?php

/**
 * @return list<string>
 */
function contentStyleProjectFiles(): array
{
    $projectRoot = dirname(__DIR__, 2);
    $extensions = [
        'css',
        'js',
        'json',
        'jsx',
        'md',
        'php',
        'ts',
        'tsx',
        'yaml',
        'yml',
    ];
    $files = [];

    foreach (new DirectoryIterator($projectRoot) as $entry) {
        if ($entry->isFile() && in_array($entry->getExtension(), $extensions, true)) {
            $files[] = $entry->getPathname();
        }
    }

    foreach ([
        'app',
        'config',
        'database',
        'docs',
        'resources',
        'routes',
        'tests',
        '.impeccable',
        '.github/workflows',
    ] as $directory) {
        $path = $projectRoot.DIRECTORY_SEPARATOR.$directory;

        if (! is_dir($path)) {
            continue;
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(
                $path,
                FilesystemIterator::SKIP_DOTS,
            ),
        );

        foreach ($iterator as $entry) {
            if ($entry->isFile() && in_array($entry->getExtension(), $extensions, true)) {
                $files[] = $entry->getPathname();
            }
        }
    }

    return $files;
}

function contentStyleProjectFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

test('first-party text files do not use the unicode em dash', function () {
    $projectRoot = dirname(__DIR__, 2).DIRECTORY_SEPARATOR;
    $violations = [];

    foreach (contentStyleProjectFiles() as $file) {
        $contents = file_get_contents($file);

        if ($contents !== false && str_contains($contents, "\u{2014}")) {
            $violations[] = str_replace($projectRoot, '', $file);
        }
    }

    expect($violations)->toBe([]);
});

test('dashboard auth and settings use the approved copy contract', function () {
    $dashboard = contentStyleProjectFile(
        'resources/js/lib/dashboard-reference-data.ts',
    );
    $surfaceCopy = implode("\n", array_map(
        contentStyleProjectFile(...),
        [
            'resources/js/pages/auth/login.tsx',
            'resources/js/pages/auth/register.tsx',
            'resources/js/pages/auth/confirm-password.tsx',
            'resources/js/pages/settings/profile.tsx',
            'resources/js/pages/settings/security.tsx',
            'resources/js/pages/settings/appearance.tsx',
            'resources/js/layouts/settings/layout.tsx',
            'resources/js/components/delete-user.tsx',
            'resources/js/components/password-input.tsx',
            'resources/js/components/alert-error.tsx',
            'resources/js/components/appearance-tabs.tsx',
        ],
    ));

    expect($dashboard)
        ->toContain("label: 'Direview oleh'")
        ->toContain('Data demo sintetis. Ini bukan aktivitas akun Anda.')
        ->not->toContain('Direviu')
        ->not->toContain('capability')
        ->not->toContain('Next action')
        ->not->toContain("'23 Jul 2026'")
        ->not->toContain("'26 Jul'")
        ->not->toContain("'30 Jul'");

    foreach ([
        'Log in to your account',
        'Email address',
        'Remember me',
        'Create account',
        'Profile settings',
        'Security settings',
        'Appearance settings',
        'Something went wrong.',
        'Delete account',
        'Show password',
        'Hide password',
    ] as $deprecatedCopy) {
        expect($surfaceCopy)->not->toContain($deprecatedCopy);
    }

    expect($surfaceCopy)
        ->toContain('Masuk ke akunmu')
        ->toContain('Nama pengguna')
        ->toContain('Pengaturan profil')
        ->toContain('Pengaturan keamanan')
        ->toContain('Pengaturan tampilan')
        ->toContain('Terjadi kesalahan.');
});

test('keeps AI context authoritative, concise, and aligned with documentation', function () {
    $agents = contentStyleProjectFile('AGENTS.md');
    $claude = contentStyleProjectFile('CLAUDE.md');
    $dataModel = contentStyleProjectFile('docs/engineering/DATA_MODEL.md');
    $testStrategy = contentStyleProjectFile(
        'docs/implementation/TEST_STRATEGY.md',
    );
    $uxReadme = contentStyleProjectFile('docs/ux/README.md');

    expect($claude)
        ->toContain('AGENTS.md` adalah satu-satunya sumber aturan agent')
        ->toContain('[`AGENTS.md`](AGENTS.md)')
        ->not->toContain('<laravel-boost-guidelines>');

    expect($agents)
        ->toContain('## Database Migrations')
        ->toContain('edit migration tabel tersebut secara langsung')
        ->toContain('`add_*_column_*`')
        ->toContain('Jangan menjalankan `npm run build` kecuali pengguna memintanya')
        ->toContain('agent boleh membuat asset gambar sendiri');

    expect($dataModel)
        ->toContain('edit migration asal tabel tersebut')
        ->toContain('`add_*_column_*`');

    expect($testStrategy)
        ->toContain('Production build pada CI atau saat pengguna memintanya')
        ->toContain('`CLAUDE.md` hanya menunjuk ke file tersebut');

    expect($uxReadme)
        ->toContain('## Asset Gambar')
        ->toContain('AI agent boleh membuat gambar sendiri');
});
