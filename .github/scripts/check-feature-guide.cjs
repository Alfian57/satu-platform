const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(
    path.join(__dirname, '../../resources/js/lib/feature-guide.ts'),
    'utf8',
);
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

const tourModule = { exports: {} };
vm.runInNewContext(
    ts.transpileModule(
        fs.readFileSync(
            path.join(__dirname, '../../resources/js/lib/student-menu-tour.ts'),
            'utf8',
        ),
        { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
    tourModule,
);

function createGuideEnvironment({ blocked = false, browser = true } = {}) {
    const items = new Map();
    const listeners = new Map();
    const calls = [];
    const context = {
        exports: {},
        Event: class {
            constructor(type) {
                this.type = type;
            }
        },
    };

    if (browser) {
        context.window = {
            localStorage: {
                getItem(key) {
                    if (blocked) {
                        throw new Error('Storage tidak tersedia');
                    }

                    return items.get(key) ?? null;
                },
                setItem(key, value) {
                    if (blocked) {
                        throw new Error('Storage tidak tersedia');
                    }

                    calls.push([key, value]);
                    items.set(key, value);
                },
            },
            addEventListener(type, callback) {
                listeners.set(type, callback);
            },
            removeEventListener(type) {
                listeners.delete(type);
            },
            dispatchEvent(event) {
                listeners.get(event.type)?.();
            },
        };
    }

    vm.runInNewContext(compiled, context);

    return { guide: context.exports, items, listeners, calls };
}

test('Penanda ditulis hanya setelah panduan ditutup dan tidak memuat data profil', () => {
    const { guide, calls } = createGuideEnvironment();
    const key = guide.featureGuideKey(101, 'student-dashboard-journey-v1');
    assert.equal(guide.hasSeenFeatureGuide(key), false);
    assert.equal(calls.length, 0);
    guide.markFeatureGuideSeen(key);
    assert.equal(guide.hasSeenFeatureGuide(key), true);
    assert.deepEqual(calls, [[key, 'seen']]);
});

test('Akun dan versi panduan memiliki penanda terpisah', () => {
    const { guide } = createGuideEnvironment();
    const key = guide.featureGuideKey(101, 'journey-v1');
    guide.markFeatureGuideSeen(key);
    assert.equal(guide.hasSeenFeatureGuide(key), true);
    assert.equal(
        guide.hasSeenFeatureGuide(guide.featureGuideKey(102, 'journey-v1')),
        false,
    );
    assert.equal(
        guide.hasSeenFeatureGuide(guide.featureGuideKey(101, 'journey-v2')),
        false,
    );
});

test('Penanda tetap terbaca setelah aplikasi dimuat ulang di browser yang sama', () => {
    const { guide, items } = createGuideEnvironment();
    const key = guide.featureGuideKey(101, 'journey-v1');
    items.set(key, 'seen');
    assert.equal(guide.hasSeenFeatureGuide(key), true);
    const otherBrowser = createGuideEnvironment();
    assert.equal(otherBrowser.guide.hasSeenFeatureGuide(key), false);
});

test('Storage gagal memakai penanda sesi tanpa menggabungkan akun', () => {
    const { guide } = createGuideEnvironment({ blocked: true });
    const key = guide.featureGuideKey(101, 'journey-v1');
    assert.equal(guide.hasSeenFeatureGuide(key), false);
    assert.doesNotThrow(() => guide.markFeatureGuideSeen(key));
    assert.equal(guide.hasSeenFeatureGuide(key), true);
    assert.equal(
        guide.hasSeenFeatureGuide(guide.featureGuideKey(102, 'journey-v1')),
        false,
    );
});

test('Perubahan storage memberi notifikasi dan subscription dapat dibersihkan', () => {
    const { guide, items, listeners } = createGuideEnvironment();
    let changes = 0;
    const unsubscribe = guide.subscribeToFeatureGuides(() => changes++);
    const key = guide.featureGuideKey(101, 'journey-v1');
    guide.markFeatureGuideSeen(key);
    assert.equal(changes, 1);
    const otherKey = guide.featureGuideKey(102, 'journey-v1');
    items.set(otherKey, 'seen');
    listeners.get('storage')();
    assert.equal(changes, 2);
    assert.equal(guide.hasSeenFeatureGuide(otherKey), true);
    unsubscribe();
    assert.equal(listeners.size, 0);
});

test('Pembacaan tanpa browser aman untuk render server', () => {
    const { guide } = createGuideEnvironment({ browser: false });
    assert.equal(
        guide.hasSeenFeatureGuide(guide.featureGuideKey(101, 'journey-v1')),
        false,
    );
});

test('Tur mengikuti empat menu inti tanpa fitur lanjutan dengan ID langkah unik', () => {
    const steps = tourModule.exports.getStudentTourSteps(true);
    const menus = [...new Set(steps.map((step) => step.menu))];
    assert.deepEqual(menus, [
        'dashboard',
        'projects',
        'contributions',
        'portfolio',
    ]);
    assert.equal(new Set(steps.map((step) => step.id)).size, steps.length);

    for (const step of steps) {
        assert.ok(step.target && step.title && step.description);
        assert.ok(!step.description.includes('\u2014'));
    }
});

test('Akses belum terverifikasi atau ditangguhkan tidak menawarkan menu terlindungi', () => {
    const steps = tourModule.exports.getStudentTourSteps(false);
    assert.equal(steps.length, 2);
    assert.ok(steps.every((step) => step.menu === 'dashboard'));
    assert.equal(steps[1].id, 'dashboard-affiliation');
});

test('Penanda ringkasan dan tur disimpan terpisah serta aman saat storage gagal', () => {
    const { guide } = createGuideEnvironment({ blocked: true });
    const summary = guide.featureGuideKey(101, 'student-dashboard-journey-v1');
    const tour = guide.featureGuideKey(
        101,
        tourModule.exports.studentMenuTourId,
    );
    guide.markFeatureGuideSeen(summary);
    assert.equal(guide.hasSeenFeatureGuide(tour), false);
    guide.markFeatureGuideSeen(tour);
    assert.equal(guide.hasSeenFeatureGuide(summary), true);
    assert.equal(guide.hasSeenFeatureGuide(tour), true);
    assert.equal(
        guide.hasSeenFeatureGuide(
            guide.featureGuideKey(102, tourModule.exports.studentMenuTourId),
        ),
        false,
    );
});
