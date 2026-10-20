const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');
const script = '.github/scripts/check-university-transition-mysql.php';
const cases = [
    ['tanpa opt-in', [], {}, 'Gunakan --run secara eksplisit'],
    [
        'production',
        ['--run'],
        { APP_ENV: 'production' },
        'hanya untuk local/testing',
    ],
    [
        'server nonlokal',
        ['--run'],
        { DB_HOST: '198.51.100.1' },
        'koneksi MySQL loopback tunggal',
    ],
    [
        'worker tanpa penanda',
        ['--worker'],
        { SATU_U06_OWNER: '../database-aplikasi' },
        'Penanda pemilik pengujian tidak sah',
    ],
];

for (const [name, args, overrides, expected] of cases) {
    test(
        'Runner MySQL menolak ' + name + ' sebelum koneksi atau migrasi',
        () => {
            const result = spawnSync('php', [script, ...args], {
                cwd: root,
                encoding: 'utf8',
                timeout: 15000,
                env: {
                    ...process.env,
                    APP_ENV: 'testing',
                    DB_CONNECTION: 'sqlite',
                    DB_DATABASE: ':memory:',
                    DB_HOST: '127.0.0.1',
                    DB_PORT: '3306',
                    DB_URL: '',
                    DB_SOCKET: '',
                    ...overrides,
                },
            });
            assert.ifError(result.error);
            assert.equal(result.status, 1);
            assert.ok((result.stdout + result.stderr).includes(expected));
            assert.ok(!result.stdout.includes('PASS Migrations'));
        },
    );
}
