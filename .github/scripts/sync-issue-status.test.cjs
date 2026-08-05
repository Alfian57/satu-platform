const assert = require('node:assert/strict');
const test = require('node:test');

const {
    parseBlockedBy,
    pullRequestReferencesIssue,
    resolveStatus,
    syncIssueStatuses,
} = require('./sync-issue-status.cjs');

function issue(number, state) {
    return { number, state };
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
