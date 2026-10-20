const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../..');
const readWorkflow = (name) =>
    yaml.load(
        fs.readFileSync(path.join(root, '.github/workflows', name), 'utf8'),
    );
const pipeline = readWorkflow('build-and-deploy.yml');
const verification = readWorkflow('tests.yml');
const mainOnly = "github.ref == 'refs/heads/main'";
const dependencies = (job) =>
    Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];

function assertGate(build, checks) {
    assert.ok(Object.hasOwn(checks.on, 'workflow_call'));
    assert.deepEqual(build.on.push.branches, ['main']);
    assert.ok(Object.hasOwn(build.on, 'workflow_dispatch'));
    assert.equal(build.jobs.ci.uses, './.github/workflows/tests.yml');
    assert.equal(build.jobs.ci.if, undefined);
    assert.equal(checks.jobs.ci.if, undefined);
    assert.equal(build.jobs.ci.secrets, undefined);
    assert.deepEqual(build.jobs.ci.permissions, {
        contents: 'read',
        'pull-requests': 'read',
    });

    for (const command of ['composer setup', 'composer ci:check']) {
        const step = checks.jobs.ci.steps.find(
            (entry) => entry.run === command,
        );
        assert.ok(step, command + ' wajib dijalankan oleh workflow canonical.');
        assert.equal(step.if, undefined);
    }

    assert.ok(dependencies(build.jobs['build-push']).includes('ci'));
    assert.ok(dependencies(build.jobs.deploy).includes('ci'));
    assert.ok(dependencies(build.jobs.deploy).includes('build-push'));

    for (const job of [
        checks.jobs.ci,
        build.jobs.ci,
        build.jobs['build-push'],
        build.jobs.deploy,
    ]) {
        assert.ok(!job['continue-on-error']);

        for (const step of job.steps || []) {
            assert.ok(!step['continue-on-error']);
        }
    }

    for (const name of ['build-push', 'deploy']) {
        assert.equal(build.jobs[name].if, mainOnly);
    }

    assert.deepEqual(build.permissions, { contents: 'read' });
    assert.deepEqual(build.jobs['build-push'].permissions, {
        contents: 'read',
        packages: 'write',
    });
    assert.deepEqual(build.jobs.deploy.permissions, {});
}

test('Publikasi dan deploy memakai CI canonical pada commit workflow yang sama', () => {
    assertGate(pipeline, verification);
});

function eligible(name, results, ref = 'refs/heads/main') {
    const job = pipeline.jobs[name];

    return (
        dependencies(job).every(
            (dependency) => results[dependency] === 'success',
        ) &&
        job.if === mainOnly &&
        ref === 'refs/heads/main'
    );
}

for (const state of ['failure', 'cancelled', 'skipped']) {
    test('CI ' + state + ' menutup publikasi dan SSH deploy', () => {
        const results = { ci: state, 'build-push': 'success' };
        assert.equal(eligible('build-push', results), false);
        assert.equal(eligible('deploy', results), false);
    });

    test('Build ' + state + ' menutup SSH deploy walau CI berhasil', () => {
        assert.equal(
            eligible('deploy', { ci: 'success', 'build-push': state }),
            false,
        );
    });
}

test('Branch selain main tidak memublikasikan image atau melakukan SSH deploy', () => {
    const results = { ci: 'success', 'build-push': 'success' };

    for (const name of ['build-push', 'deploy']) {
        assert.equal(eligible(name, results, 'refs/heads/chore/qa'), false);
        assert.equal(eligible(name, results, 'refs/tags/release'), false);
        assert.equal(eligible(name, results), true);
    }
});

for (const [name, mutate] of [
    ['build tanpa CI', (build) => delete build.jobs['build-push'].needs],
    ['deploy tanpa CI', (build) => (build.jobs.deploy.needs = ['build-push'])],
    ['bypass always', (build) => (build.jobs.deploy.if = 'always()')],
    ['CI boleh gagal', (build) => (build.jobs.ci['continue-on-error'] = true)],
    ['test dilewati', (build, checks) => (checks.jobs.ci.if = 'false')],
    ['secret VPS ke CI', (build) => (build.jobs.ci.secrets = 'inherit')],
    [
        'test boleh gagal',
        (build, checks) =>
            (checks.jobs.ci.steps.find(
                (step) => step.run === 'composer ci:check',
            )['continue-on-error'] = true),
    ],
]) {
    test('Regresi konfigurasi ditolak: ' + name, () => {
        const build = structuredClone(pipeline);
        const checks = structuredClone(verification);
        mutate(build, checks);
        assert.throws(() => assertGate(build, checks));
    });
}
