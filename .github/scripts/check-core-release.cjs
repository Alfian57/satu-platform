const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const suites = [
    ['php', ['.github/scripts/check-core-navigation.php']],
    ['php', ['.github/scripts/check-student-capabilities.php']],
    ['php', ['.github/scripts/check-project-opportunities.php']],
    ['php', ['.github/scripts/check-dynamic-matching.php']],
    ['php', ['.github/scripts/check-team-formation.php']],
    ['php', ['.github/scripts/check-workspace-collaboration.php']],
    ['php', ['.github/scripts/check-contribution-recognition.php']],
    ['php', ['.github/scripts/check-opportunity-support.php']],
    ['php', ['.github/scripts/check-core-journey.php']],
    ['php', ['.github/scripts/check-backend-integration.php']],
    [
        'node',
        [
            '--test',
            '.github/scripts/check-brand-assets.cjs',
            '.github/scripts/check-feature-guide.cjs',
            '.github/scripts/check-landing-demo.cjs',
            '.github/scripts/check-landing-journey.cjs',
        ],
    ],
    ['node', ['.github/scripts/check-product-docs.cjs']],
];

if (process.argv.includes('--browser')) {
    for (const suite of [
        'core-journey-browser',
        'backend-integration-browser',
        'student-capabilities',
        'project-opportunities',
        'workspace-collaboration',
        'contribution-recognition',
        'opportunity-support',
    ]) {
        suites.push(['node', ['.github/scripts/check-' + suite + '.cjs']]);
    }
}

for (const [command, args] of suites) {
    console.log('\nVerifikasi: ' + args.join(' '));
    const result = spawnSync(command, args, {
        cwd: root,
        stdio: 'inherit',
        shell: false,
    });

    if (result.error || result.status !== 0) {
        console.error(result.error || 'Pemeriksaan gagal: ' + args.join(' '));
        process.exit(1);
    }
}

console.log(
    'Suite teknis inti lulus. Ini bukan persetujuan UAT, pilot atau concurrency MySQL.',
);
