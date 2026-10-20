const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const context = { exports: {} };
vm.runInNewContext(
    ts.transpileModule(
        fs.readFileSync(
            path.join(__dirname, '../../resources/js/lib/landing-demo.ts'),
            'utf8',
        ),
        { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
    context,
);
const {
    DEMO_NODES,
    DEMO_EDGES,
    DEMO_KIND_LABELS,
    getDemoNode,
    getDemoRelations,
    getDemoRelatedIds,
    createDemoConnector,
} = context.exports;

test('Setiap arsip dan hubungan synthetic memiliki identitas serta endpoint yang valid', () => {
    assert.equal(
        new Set(DEMO_NODES.map((node) => node.id)).size,
        DEMO_NODES.length,
    );
    assert.equal(
        new Set(DEMO_EDGES.map((edge) => edge.id)).size,
        DEMO_EDGES.length,
    );

    for (const node of DEMO_NODES) {
        assert.ok(DEMO_KIND_LABELS[node.kind]);
        assert.ok(
            node.label && node.description && node.next && node.facts.length,
        );
    }

    for (const edge of DEMO_EDGES) {
        assert.ok(getDemoNode(edge.source));
        assert.ok(getDemoNode(edge.target));
        assert.notEqual(edge.source, edge.target);
    }

    assert.equal(getDemoNode('missing'), undefined);
});

test('Kontribusi dan karya Budi tidak berasal dari pekerjaan Siti', () => {
    assert.ok(
        DEMO_EDGES.some(
            (edge) => edge.source === 'budi' && edge.target === 'contribution',
        ),
    );
    assert.ok(
        !DEMO_EDGES.some(
            (edge) =>
                edge.source === 'siti' &&
                ['contribution', 'validation', 'portfolio'].includes(
                    edge.target,
                ),
        ),
    );
    assert.ok(
        getDemoNode('contribution').facts.some(
            ([label, value]) =>
                label === 'Pemilik kontribusi' && value === 'Budi',
        ),
    );
    assert.ok(getDemoNode('portfolio').description.includes('tidak otomatis'));
});

test('Sorotan hanya mencakup arsip dan hubungan terdekatnya', () => {
    assert.deepEqual([...getDemoRelatedIds('siti')].sort(), ['siti', 'team']);
    assert.deepEqual([...getDemoRelatedIds('portfolio')].sort(), [
        'portfolio',
        'validation',
    ]);
    assert.deepEqual([...getDemoRelatedIds(null)], []);
    assert.equal(getDemoRelations('budi').length, 2);
});

test('Konektor horizontal berhenti di tepi kartu, bukan melewati isinya', () => {
    const d = createDemoConnector(
        { left: 20, top: 20, width: 160, height: 200 },
        { left: 220, top: 20, width: 160, height: 200 },
        false,
    );
    assert.ok(d.startsWith('M 180 120 C'));
    assert.ok(d.endsWith('220 120'));
    assert.ok(!d.includes('NaN'));
});

test('Konektor vertikal melewati sisi cabang anggota dan tetap terarah', () => {
    const d = createDemoConnector(
        { left: 20, top: 20, width: 200, height: 180 },
        { left: 20, top: 500, width: 200, height: 180 },
        false,
    );
    assert.ok(d.startsWith('M 120 200 C'));
    assert.ok(d.includes(' L 8 '));
    assert.ok(d.endsWith('120 500'));
    const member = createDemoConnector(
        { left: 30, top: 300, width: 100, height: 160 },
        { left: 20, top: 20, width: 200, height: 180 },
        true,
    );
    assert.ok(member.startsWith('M 80 300 C'));
    assert.ok(member.endsWith('120 200'));
});
