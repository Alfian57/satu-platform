const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const historicalPages = new Set([
    'pages/platform/affiliations.tsx',
    'pages/platform/operations.tsx',
]);

test('Antarmuka aktif tidak menawarkan layanan banyak kampus', () => {
    const base = path.join(root, 'resources/js');
    const misleadingCopy =
        /universitas\s+tujuan|semua\s+institusi|lintas\s+(kampus|institusi)|kampus\s+terpilih|institusi\s+aktif|universitas\s+baru/iu;

    for (const file of fs.readdirSync(base, { recursive: true })) {
        const relative = file.replaceAll(path.sep, '/');

        if (
            !/\.(tsx|ts)$/.test(relative) ||
            /^(actions|routes|wayfinder)\//.test(relative) ||
            historicalPages.has(relative)
        ) {
            continue;
        }

        assert.ok(
            !misleadingCopy.test(read('resources/js/' + relative)),
            'Copy multi-kampus tidak boleh muncul pada ' + relative,
        );
    }
});

test('Landing menjelaskan sasaran UTY tanpa pendaftaran admin publik', () => {
    const source = read('resources/js/pages/welcome.tsx');
    assert.ok(
        source.includes('SATU digunakan oleh mahasiswa ${universityName}.'),
    );
    assert.match(source, /questions\(publicUniversity\?\.name\)/);
    assert.match(source, /bukan pendaftaran umum/);
    assert.match(source, /publicUniversity\?\.name/);
});

test('Verifikasi mahasiswa mempertahankan nama server serta proteksi draft', () => {
    const source = read('resources/js/components/onboarding-modal.tsx');
    assert.match(source, /aria-label="Universitas"/);
    assert.ok(source.includes('onboarding?.institutionName'));
    assert.match(source, /Pengaturan layanan berubah/);
    assert.match(source, /Data yang sudah tersimpan tidak diubah/);
    assert.match(source, /contextChanged/);
    assert.match(source, /data-test="onboarding-legacy"/);
    assert.doesNotMatch(source, /Tidak perlu memilih\s+kampus/);
});

test('Sistem hanya menawarkan workspace mahasiswa dan Admin Universitas', () => {
    const source = read('resources/js/types/auth.ts');
    assert.ok(source.includes("'campus_admin' | 'student'"));
    assert.ok(
        !source.includes("'recruiter'") && !source.includes("'platform_admin'"),
    );
    assert.ok(
        !fs.existsSync(path.join(root, 'resources/js/pages/talent/search.tsx')),
    );
    const routes = read('routes/web.php');
    assert.ok(!routes.includes('recruiter/talent'));
    assert.ok(
        !read('resources/js/components/app-sidebar.tsx').includes(
            'Ruang perekrut',
        ),
    );
});

test('Halaman platform historis tetap dialihkan, bukan diaktifkan kembali', () => {
    for (const [file, route] of [
        ['PlatformAffiliationController.php', 'campus.affiliations.index'],
        ['PlatformOperationsController.php', 'campus.overview.show'],
    ]) {
        const source = read('app/Http/Controllers/' + file);
        assert.match(source, new RegExp(route.replaceAll('.', '\\.')));
        assert.doesNotMatch(source, /Inertia::render\(['"]platform\//);
    }
});
