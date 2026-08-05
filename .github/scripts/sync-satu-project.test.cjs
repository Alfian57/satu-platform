const assert = require('node:assert/strict');
const test = require('node:test');

const {
    DELIVERY_STATUSES,
    buildProjectStatusRecords,
    currentItemOptionId,
    mapIssueDeliveryStatus,
    mapPullRequestDeliveryStatus,
    selectDeliveryStatusField,
    syncSatuProject,
} = require('./sync-satu-project.cjs');

const PROJECT_ID = 'PVT_project';
const FIELD_ID = 'PVTSSF_delivery';
const OPTIONS = {
    Ready: 'option-ready',
    Blocked: 'option-blocked',
    'In progress': 'option-progress',
    'In review': 'option-review',
    Done: 'option-done',
};

function issue(number, state = 'open', body = '', labels = []) {
    return {
        node_id: `I_${number}`,
        number,
        state,
        body,
        labels: labels.map((name) => ({ name })),
        pull_request: undefined,
    };
}

function pullRequest(
    number,
    state = 'open',
    draft = false,
    body = '',
    baseRef = 'main',
) {
    return {
        node_id: `P_${number}`,
        number,
        state,
        draft,
        body,
        base: { ref: baseRef },
    };
}

function projectField() {
    return {
        __typename: 'ProjectV2SingleSelectField',
        id: FIELD_ID,
        name: 'Delivery Status',
        options: DELIVERY_STATUSES.map((name) => ({
            id: OPTIONS[name],
            name,
        })),
    };
}

function projectItem(number, state = 'OPEN', optionId = OPTIONS.Ready) {
    return {
        id: `PVTI_${number}`,
        content: {
            __typename: 'Issue',
            id: `I_${number}`,
            number,
            state,
            title: `Issue ${number}`,
            body: '',
            labels: { nodes: [] },
        },
        fieldValues: {
            nodes: [
                {
                    __typename: 'ProjectV2ItemFieldSingleSelectValue',
                    field: { id: FIELD_ID, name: 'Delivery Status' },
                    optionId,
                    name: DELIVERY_STATUSES.find(
                        (status) => OPTIONS[status] === optionId,
                    ),
                },
            ],
        },
    };
}

function fakeGithub({
    issues = [],
    pullRequests = [],
    projectItems = [],
    failOn,
} = {}) {
    const calls = [];
    const rest = {
        issues: { listForRepo: Symbol('issues.listForRepo') },
        pulls: { list: Symbol('pulls.list') },
    };

    return {
        calls,
        rest,
        paginate: async (endpoint) => {
            if (endpoint === rest.issues.listForRepo) {
                return issues;
            }

            return pullRequests;
        },
        graphql: async (query, variables) => {
            calls.push({ query, variables });

            if (failOn && query.includes(failOn)) {
                throw new Error('simulated API failure');
            }

            if (query.includes('query ProjectMetadata')) {
                return {
                    user: {
                        projectV2: {
                            id: PROJECT_ID,
                            number: 3,
                            title: 'SATU Delivery',
                            fields: { nodes: [projectField()] },
                        },
                    },
                };
            }

            if (query.includes('query ProjectItems')) {
                return {
                    node: {
                        items: {
                            nodes: projectItems,
                            pageInfo: { hasNextPage: false, endCursor: null },
                        },
                    },
                };
            }

            if (query.includes('mutation AddProjectItem')) {
                return {
                    addProjectV2ItemById: {
                        item: { id: 'PVTI_added' },
                    },
                };
            }

            if (query.includes('mutation UpdateProjectItemStatus')) {
                return {
                    updateProjectV2ItemFieldValue: {
                        projectV2Item: { id: variables.itemId },
                    },
                };
            }

            throw new Error(`Unexpected GraphQL operation: ${query}`);
        },
    };
}

function context() {
    return { repo: { owner: 'Alfian57', repo: 'satu-platform' } };
}

function core() {
    return {
        info() {},
        warning() {},
    };
}

test('maps issue and pull request states to Delivery Status', () => {
    const allIssuesByNumber = new Map([
        [10, issue(10, 'open')],
        [11, issue(11, 'open')],
    ]);

    assert.equal(
        mapIssueDeliveryStatus(issue(10), {
            allIssuesByNumber,
            pullRequests: [],
        }),
        'Ready',
    );
    assert.equal(
        mapIssueDeliveryStatus(issue(10, 'open', '- **Blocked by:** #11'), {
            allIssuesByNumber,
            pullRequests: [],
        }),
        'Blocked',
    );
    assert.equal(
        mapIssueDeliveryStatus(issue(12, 'open', '- **Blocked by:** #13'), {
            allIssuesByNumber: new Map([
                [13, issue(13, 'open', '', ['contract-ready'])],
            ]),
            pullRequests: [
                pullRequest(
                    12,
                    'open',
                    true,
                    'Closes #12\n- **Stacked on:** #13',
                    'feature/13-parent',
                ),
            ],
        }),
        'In progress',
    );
    assert.equal(mapIssueDeliveryStatus(issue(10, 'closed'), {}), 'Done');
    assert.equal(
        mapPullRequestDeliveryStatus(pullRequest(20, 'open', true)),
        'In progress',
    );
    assert.equal(
        mapPullRequestDeliveryStatus(pullRequest(21, 'open', false)),
        'In review',
    );
    assert.equal(
        mapPullRequestDeliveryStatus(pullRequest(22, 'closed', false)),
        'Done',
    );
});

test('builds records without scheduling closed pull requests for backfill', () => {
    const records = buildProjectStatusRecords({
        issues: [issue(1), issue(2, 'closed')],
        pullRequests: [pullRequest(3), pullRequest(4, 'closed')],
    });

    assert.equal(records.get('issue:1').status, 'Ready');
    assert.equal(records.get('issue:2').status, 'Done');
    assert.equal(records.get('pull:3').status, 'In review');
    assert.equal(records.has('pull:4'), false);
    assert.equal(records.get('issue:2').open, false);
});

test('includes non-main stacked Pull Requests when resolving issue status', () => {
    const records = buildProjectStatusRecords({
        issues: [
            issue(4, 'open', '', ['contract-ready']),
            issue(5, 'open', '- **Blocked by:** #4'),
        ],
        pullRequests: [
            pullRequest(
                5,
                'open',
                true,
                'Closes #5\n- **Stacked on:** #4',
                'feature/4-parent',
            ),
        ],
    });

    assert.equal(records.get('issue:5').status, 'In progress');
});

test('rejects a field with missing status options', () => {
    assert.throws(
        () =>
            selectDeliveryStatusField([
                {
                    id: FIELD_ID,
                    name: 'Delivery Status',
                    options: [{ id: OPTIONS.Ready, name: 'Ready' }],
                },
            ]),
        /kehilangan option/,
    );
});

test('reads current single-select value from a project item', () => {
    assert.equal(
        currentItemOptionId(projectItem(1, 'OPEN', OPTIONS.Blocked), FIELD_ID),
        OPTIONS.Blocked,
    );
});

test('adds missing items and updates stale status without duplicates', async () => {
    const github = fakeGithub({
        issues: [issue(1), issue(2)],
        projectItems: [projectItem(1, 'OPEN', OPTIONS.Ready)],
    });
    const result = await syncSatuProject({
        github,
        context: context(),
        core: core(),
        projectOwner: 'Alfian57',
        projectNumber: 3,
    });

    assert.equal(result.added, 1);
    assert.equal(result.updated, 1);
    assert.equal(result.unchanged, 1);
    assert.equal(
        github.calls.filter((call) => call.query.includes('AddProjectItem'))
            .length,
        1,
    );
    assert.equal(
        github.calls.filter((call) =>
            call.query.includes('UpdateProjectItemStatus'),
        ).length,
        1,
    );
});

test('dry run reports additions and performs no mutation', async () => {
    const github = fakeGithub({ issues: [issue(1)], projectItems: [] });
    const result = await syncSatuProject({
        github,
        context: context(),
        core: core(),
        dryRun: true,
        projectOwner: 'Alfian57',
        projectNumber: 3,
    });

    assert.equal(result.dryRun, true);
    assert.equal(result.added, 1);
    assert.equal(
        github.calls.some((call) => call.query.includes('AddProjectItem')),
        false,
    );
    assert.equal(
        github.calls.some((call) =>
            call.query.includes('UpdateProjectItemStatus'),
        ),
        false,
    );
});

test('closed project item is marked Done', async () => {
    const github = fakeGithub({
        issues: [issue(1, 'closed')],
        projectItems: [projectItem(1, 'CLOSED', OPTIONS.Ready)],
    });
    const result = await syncSatuProject({
        github,
        context: context(),
        core: core(),
        projectOwner: 'Alfian57',
        projectNumber: 3,
    });

    assert.equal(result.updated, 1);
    const update = github.calls.find((call) =>
        call.query.includes('UpdateProjectItemStatus'),
    );
    assert.equal(update.variables.optionId, OPTIONS.Done);
});

test('requires project configuration', async () => {
    await assert.rejects(
        () =>
            syncSatuProject({
                github: fakeGithub(),
                context: context(),
                core: core(),
                projectOwner: 'Alfian57',
                projectNumber: 0,
            }),
        /SATU_PROJECT_OWNER dan SATU_PROJECT_NUMBER wajib tersedia/,
    );
});

test('surfaces GitHub API errors with an actionable prefix', async () => {
    await assert.rejects(
        () =>
            syncSatuProject({
                github: fakeGithub({ failOn: 'query ProjectMetadata' }),
                context: context(),
                core: core(),
                projectOwner: 'Alfian57',
                projectNumber: 3,
            }),
        /GitHub Project GraphQL request failed: simulated API failure/,
    );
});
