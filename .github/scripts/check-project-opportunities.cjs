const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {}, Date };
vm.runInNewContext(
    ts.transpileModule(
        fs.readFileSync(
            path.join(
                __dirname,
                '../../resources/js/lib/project-opportunities.ts',
            ),
            'utf8',
        ),
        {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2022,
            },
        },
    ).outputText,
    context,
);
const { beginnerLabel, capacityLabel, opportunityStatus } = context.exports;
test('Penerimaan pemula hanya berasal dari pernyataan tiga keadaan', () => {
    assert.equal(beginnerLabel(true), 'Menerima pemula');
    assert.equal(beginnerLabel(false), 'Membutuhkan pengalaman');
    assert.equal(beginnerLabel(null), 'Penerimaan pemula belum dinyatakan');
    assert.equal(beginnerLabel(undefined), beginnerLabel(null));
});
test('Kapasitas tanpa data tidak dianggap kosong', () => {
    assert.equal(
        capacityLabel(undefined, 5),
        'Total 5 orang. Data terisi belum tersedia.',
    );
    assert.equal(
        capacityLabel(
            { total: 5, occupied: 2, remaining: 3, accepting: true },
            5,
        ),
        '2 terisi dari 5. 3 tempat tersisa.',
    );
});
test('Sisa fisik tidak berarti pengajuan terbuka atau diterima', () => {
    const stats = { total: 5, occupied: 2, remaining: 3, accepting: false };
    const future = '2099-01-01T00:00:00Z';

    for (const status of ['closed', 'cancelled', 'draft', 'archived']) {
        assert.equal(
            opportunityStatus(stats, status, future),
            'Pengajuan tidak dibuka.',
        );
    }

    assert.equal(
        opportunityStatus(stats, 'open', '2000-01-01'),
        'Batas pengajuan sudah lewat.',
    );
    assert.equal(
        opportunityStatus({ ...stats, remaining: 0 }, 'open', future),
        'Kapasitas tim penuh.',
    );
    assert.equal(
        opportunityStatus(undefined, 'open', future),
        'Periksa tempat dan izin pada detail proyek.',
    );
    assert.equal(
        opportunityStatus({ ...stats, accepting: true }, 'open', future),
        'Pengajuan masih dibuka. Tempat dapat berubah.',
    );
});
