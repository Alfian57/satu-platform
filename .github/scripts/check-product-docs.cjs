const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const files = [
    'PRODUCT.md',
    'docs/product/PRD.md',
    'docs/product/BUSINESS_FLOW.md',
    'docs/product/BUSINESS_MODEL.md',
    'docs/implementation/ROADMAP.md',
    'docs/governance/DECISIONS.md',
    'docs/ux/SCREEN_INVENTORY.md',
    'docs/ux/USER_FLOWS.md',
    'docs/ux/CONTENT_ACCESSIBILITY.md',
    'DESIGN.md',
    'docs/engineering/ARCHITECTURE.md',
    'docs/engineering/SECURITY_PRIVACY.md',
    'docs/engineering/DATA_MODEL.md',
    'docs/engineering/OPERATIONS.md',
];
const read = (file) => fs.readFileSync(path.resolve(root, file), 'utf8');
const slug = (text) =>
    text
        .toLowerCase()
        .replace(/[`*_]/g, '')
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .trim()
        .replace(/\s/g, '-');
let links = 0;

for (const file of files) {
    const text = read(file);
    assert.ok(!text.includes('\u2014'), file + ': no em dash');
    const plain = text.replace(/```[\s\S]*?```/g, '');

    for (const [, href] of plain.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        if (/^(?:https?:|mailto:)/.test(href)) {
            continue;
        }

        const [filename, anchor] = href.split('#');
        const target = filename
            ? path.resolve(
                  path.dirname(path.resolve(root, file)),
                  decodeURIComponent(filename),
              )
            : path.resolve(root, file);
        assert.ok(
            fs.existsSync(target),
            file + ': missing internal link ' + href,
        );

        if (anchor && target.endsWith('.md')) {
            const headings = [
                ...fs
                    .readFileSync(target, 'utf8')
                    .matchAll(/^#{1,6}\s+(.+)$/gm),
            ].map((m) => slug(m[1]));
            assert.ok(
                headings.includes(anchor),
                file + ': missing heading anchor ' + href,
            );
        }

        links++;
    }
}

const product = read(files[0]),
    prd = read(files[1]),
    flow = read(files[2]),
    roadmap = read(files[4]),
    decisions = read(files[5]);
assert.ok(
    !product.includes('Rilis perlombaan mencakup seluruh kapabilitas proposal'),
);
assert.ok(!prd.includes('Seluruh milestone M0 sampai M9 selesai'));
assert.ok(decisions.includes('digantikan DEC-033 untuk rilis inti'));
assert.equal((decisions.match(/^### DEC-033:/gm) || []).length, 1);

for (let i = 1; i <= 12; i++) {
    const id = 'FR-' + String(i).padStart(2, '0');
    assert.equal(
        (prd.match(new RegExp('^### ' + id + ' ', 'gm')) || []).length,
        1,
        id + ': exactly one requirement',
    );
    assert.ok(prd.includes('| ' + id + ' '), id + ': traceability row exists');
}

for (let i = 1; i <= 10; i++) {
    const id = 'T' + String(i).padStart(2, '0');
    assert.ok(
        new RegExp('^### ' + id + ':', 'm').test(roadmap),
        id + ': phase detail exists',
    );
    assert.ok(
        new RegExp('^\\|\\s*' + id + '\\s*\\|', 'm').test(roadmap),
        id + ': overview exists',
    );
    assert.ok(prd.includes(id), id + ': requirement mapping exists');
}

for (const match of prd.matchAll(/\|\s*FR-\d{2}\s*\|[^\n]+\|([^\n]+)\|/g)) {
    for (const stage of match[1].match(/T\d{2}/g) || []) {
        assert.ok(new RegExp('^### ' + stage + ':', 'm').test(roadmap));
    }
}

for (const content of [product, prd, flow, roadmap]) {
    assert.ok(
        content.includes('tanpa') && content.includes('riwayat'),
        'Newcomer and prior-history handling',
    );
    assert.ok(content.includes('sintetis'), 'Synthetic truth');
    assert.ok(content.includes('kepribadian'), 'Non-diagnostic boundary');
}

for (const target of [
    'docs/ux/SCREEN_INVENTORY.md',
    'docs/ux/CONTENT_ACCESSIBILITY.md',
    'docs/ux/LOADING_STATES.md',
    'DESIGN.md',
]) {
    assert.ok(fs.existsSync(path.resolve(root, target)));
}

console.log(
    'PASS ' +
        files.length +
        ' documents, ' +
        links +
        ' internal links/anchors, 12 requirements, 10 stage mappings, scope supersession, UX references, and product boundaries.',
);
