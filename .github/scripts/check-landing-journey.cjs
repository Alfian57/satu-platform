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
            path.join(__dirname, '../../resources/js/lib/landing-journey.ts'),
            'utf8',
        ),
        { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
    context,
);
const { JOURNEY_STAGES, JOURNEY_SCENARIOS, getJourneyStage } = context.exports;

test('Satu cerita berawal tanpa karya dan berakhir pada izin berbagi', () => {
    assert.equal(JOURNEY_STAGES.length, 8);
    assert.equal(new Set(JOURNEY_STAGES.map((stage) => stage.id)).size, 8);
    assert.match(JOURNEY_STAGES[0].description, /tanpa portofolio/);
    assert.match(JOURNEY_STAGES[7].description, /mencabut/);

    for (const stage of JOURNEY_STAGES) {
        for (const key of [
            'actor',
            'title',
            'status',
            'description',
            'boundary',
            'next',
        ]) {
            assert.ok(stage[key]);
        }

        assert.ok(stage.facts.length > 0);
        assert.ok(!JSON.stringify(stage).includes('\u2014'));
    }
});

test('Kapasitas penuh berhenti sebelum workspace, bukan menolak kemampuan', () => {
    const stage = getJourneyStage(3, 'full');
    assert.match(stage.status, /belum/);
    assert.match(stage.description, /tetap menunggu/);
    assert.match(stage.boundary, /berhenti di keputusan/);
});

test('Keputusan revisi tidak menghasilkan karya; kelanjutan memerlukan approval baru', () => {
    assert.match(getJourneyStage(6, 'revision').status, /revisi/);
    assert.ok(
        getJourneyStage(6, 'revision').facts.some(([, value]) =>
            value.includes('Belum dihasilkan'),
        ),
    );
    assert.match(getJourneyStage(7, 'revision').description, /dari versi baru/);
    assert.equal(JOURNEY_SCENARIOS.length, 3);
    assert.equal(getJourneyStage(-1, 'main').id, 'profile');
});
