const assert = require('node:assert/strict');
const test = require('node:test');

const {
    STATUS_LABELS,
    parseBlockedBy,
    parseStackedOn,
    pullRequestReferencesIssue,
    resolveStatus,
    syncIssueStatuses,
} = require('./sync-issue-status.cjs');

function issue(number, state, labels = []) {
    return {
        number,
        state,
        labels: labels.map((name) => ({ name })),
    };
}

function resolve({
    issueNumber = 10,
    body = '',
    dependencies = [],
    pullRequests = [],
} = {}) {
    return resolveStatus({
        issueNumber,
        body,
        allIssuesByNumber: new Map(dependencies),
        pullRequests,
    });
}

test('exports the workflow entrypoint as a callable named export', () => {
    assert.equal(typeof syncIssueStatuses, 'function');
    assert.equal(STATUS_LABELS.includes('stacked'), true);
});

test('parses multiple blockers and removes duplicates', () => {
    assert.deepEqual(
        parseBlockedBy('- **Blocked by:** #21, #22, #21'),
        [21, 22],
    );
});

test('does not treat completed prerequisite as a blocker', () => {
    assert.deepEqual(
        parseBlockedBy(
            '- **Blocked by:** Tidak ada hard dependency.\n- **Prerequisite completed:** #71',
        ),
        [],
    );
});

test('rejects a malformed blocker field', () => {
    assert.throws(
        () => parseBlockedBy('- **Blocked by:** pending approval'),
        /does not contain an issue reference/,
    );
});

test('parses a single stacked parent issue', () => {
    assert.equal(parseStackedOn('- **Stacked on:** #21'), 21);
    assert.equal(parseStackedOn('- **Stacked on:** N/A'), null);
});

test('rejects multiple stacked parent issues', () => {
    assert.throws(
        () => parseStackedOn('- **Stacked on:** #21, #22'),
        /exactly one issue reference/,
    );
});

test('returns ready when all dependencies are closed and no PR is open', () => {
    assert.deepEqual(
        resolve({
            body: '- **Blocked by:** #21',
            dependencies: [[21, issue(21, 'closed')]],
        }),
        { status: 'ready', blockerNumbers: [21], openBlockers: [] },
    );
});

test('returns blocked when one dependency is still open', () => {
    assert.deepEqual(
        resolve({
            body: '- **Blocked by:** #21, #22',
            dependencies: [
                [21, issue(21, 'closed')],
                [22, issue(22, 'open')],
            ],
        }),
        { status: 'blocked', blockerNumbers: [21, 22], openBlockers: [22] },
    );
});

test('returns in-progress for a related draft PR', () => {
    assert.deepEqual(
        resolve({
            pullRequests: [{ body: 'Closes #10', draft: true }],
        }).status,
        'in-progress',
    );
});

test('returns needs-review for a related ready PR', () => {
    assert.deepEqual(
        resolve({
            pullRequests: [{ body: 'Closes #10', draft: false }],
        }).status,
        'needs-review',
    );
});

test('blocked takes precedence over an active PR', () => {
    assert.deepEqual(
        resolve({
            body: '- **Blocked by:** #21',
            dependencies: [[21, issue(21, 'open')]],
            pullRequests: [{ body: 'Closes #10', draft: false }],
        }).status,
        'blocked',
    );
});

test('returns stacked for a valid contract-ready parent PR', () => {
    assert.deepEqual(
        resolve({
            body: '- **Blocked by:** #21',
            dependencies: [[21, issue(21, 'open', ['contract-ready'])]],
            pullRequests: [
                {
                    body: 'Closes #10\n- **Stacked on:** #21',
                    draft: true,
                    base: { ref: 'feature/21-parent' },
                },
            ],
        }),
        { status: 'stacked', blockerNumbers: [21], openBlockers: [21] },
    );
});

test('keeps a stacked candidate blocked without contract-ready parent', () => {
    assert.equal(
        resolve({
            body: '- **Blocked by:** #21',
            dependencies: [[21, issue(21, 'open')]],
            pullRequests: [
                {
                    body: 'Closes #10\n- **Stacked on:** #21',
                    draft: true,
                    base: { ref: 'feature/21-parent' },
                },
            ],
        }).status,
        'blocked',
    );
});

test('keeps a stacked candidate blocked when its base is main', () => {
    assert.equal(
        resolve({
            body: '- **Blocked by:** #21',
            dependencies: [[21, issue(21, 'open', ['contract-ready'])]],
            pullRequests: [
                {
                    body: 'Closes #10\n- **Stacked on:** #21',
                    draft: true,
                    base: { ref: 'main' },
                },
            ],
        }).status,
        'blocked',
    );
});

test('matches all supported closing verbs', () => {
    for (const verb of [
        'close',
        'closes',
        'closed',
        'fix',
        'fixes',
        'fixed',
        'resolve',
        'resolves',
        'resolved',
    ]) {
        assert.equal(
            pullRequestReferencesIssue(
                { body: `${verb} #10`, draft: false },
                10,
            ),
            true,
        );
    }
});

test('syncIssueStatuses skips malformed blocker and continues syncing valid issues', async () => {
    const synced = [];
    const warnings = [];
    const infos = [];
    let failedMessage = null;

    const github = {
        paginate: async (method, params) => {
            const response = await method(params);

            return response.data;
        },
        rest: {
            issues: {
                listForRepo: async (params) => {
                    assert.ok(params);

                    return {
                        data: [
                            { number: 1, state: 'open', labels: [{ name: 'bug' }], body: '' },
                            {
                                number: 2,
                                state: 'open',
                                labels: [],
                                body: '- **Blocked by:** pending approval',
                            },
                            { number: 3, state: 'open', labels: [{ name: 'ready' }], body: '' },
                        ],
                    };
                },
                setLabels: async ({ issue_number, labels }) => {
                    synced.push({ number: issue_number, labels });
                },
            },
            pulls: {
                list: async () => ({ data: [] }),
            },
        },
    };
    const context = { repo: { owner: 'test', repo: 'test' } };
    const core = {
        info: (msg) => infos.push(msg),
        warning: (msg) => warnings.push(msg),
        setFailed: (msg) => (failedMessage = msg),
        summary: null,
    };

    await syncIssueStatuses({ github, context, core });

    assert.equal(synced.length, 1);
    assert.equal(synced[0].number, 1);
    assert.deepEqual(synced[0].labels, ['bug', 'ready']);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Issue #2 skipped/);
    assert.notEqual(failedMessage, null);
    assert.match(failedMessage, /#2/);
});

test('syncIssueStatuses does not fail on empty or fully valid issues', async () => {
    const synced = [];
    let failedMessage = undefined;

    const github = {
        paginate: async (method, params) => {
            const response = await method(params);

            return response.data;
        },
        rest: {
            issues: {
                listForRepo: async (params) => {
                    assert.ok(params);

                    return {
                        data: [
                            { number: 1, state: 'open', labels: [], body: '' },
                        ],
                    };
                },
                setLabels: async ({ issue_number, labels }) => {
                    synced.push({ number: issue_number, labels });
                },
            },
            pulls: {
                list: async () => ({ data: [] }),
            },
        },
    };
    const context = { repo: { owner: 'test', repo: 'test' } };
    const core = {
        info: () => {},
        warning: () => {},
        setFailed: (msg) => (failedMessage = msg),
        summary: null,
    };

    await syncIssueStatuses({ github, context, core });

    assert.equal(synced.length, 1);
    assert.equal(failedMessage, undefined);
});
