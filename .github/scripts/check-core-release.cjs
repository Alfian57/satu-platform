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
    ['php', ['.github/scripts/check-core-flow-ui-seeder.php']],
    ['php', ['.github/scripts/check-university-foundation.php']],
    ['php', ['.github/scripts/check-university-authorization.php']],
    ['php', ['.github/scripts/check-university-activation.php']],
    ['php', ['.github/scripts/check-university-workspace.php']],
    ['php', ['.github/scripts/check-affiliation-review-privacy.php']],
    ['php', ['.github/scripts/check-leaderboard-integration.php']],
    ['php', ['.github/scripts/check-portfolio-privacy.php']],
    [
        'node',
        [
            '--test',
            '.github/scripts/check-ci-workflows.cjs',
            '.github/scripts/check-brand-assets.cjs',
            '.github/scripts/check-feature-guide.cjs',
            '.github/scripts/check-landing-demo.cjs',
            '.github/scripts/check-landing-journey.cjs',
            '.github/scripts/check-university-transition-guards.cjs',
            '.github/scripts/check-single-university-copy.cjs',
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
        'university-activation-browser',
        'university-workspace-browser',
        'admin-hero-layout',
        'leaderboard-browser',
        'portfolio-privacy-browser',
        'account-settings-browser',
        'confirm-password-browser',
    ]) {
        suites.push(['node', ['.github/scripts/check-' + suite + '.cjs']]);
    }
}

if (process.argv.includes('--mysql')) {
    suites.push([
        'php',
        ['.github/scripts/check-university-transition-mysql.php', '--run'],
    ]);
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
    'Suite teknis inti lulus. MySQL lokal hanya diperiksa jika --mysql dipilih. Ini bukan UAT, pilot, load test atau recovery production.',
);
