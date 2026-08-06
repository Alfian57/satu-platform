const { resolveStatus } = require('./sync-issue-status.cjs');

const DELIVERY_STATUSES = [
    'Ready',
    'Blocked',
    'In progress',
    'In review',
    'Done',
];

const PROJECT_METADATA_QUERY = `
    query ProjectMetadata($owner: String!, $number: Int!) {
        user(login: $owner) {
            projectV2(number: $number) {
                id
                number
                title
                fields(first: 100) {
                    nodes {
                        __typename
                        ... on ProjectV2SingleSelectField {
                            id
                            name
                            options {
                                id
                                name
                            }
                        }
                    }
                }
            }
        }
    }
`;

const PROJECT_ITEMS_QUERY = `
    query ProjectItems($projectId: ID!, $cursor: String) {
        node(id: $projectId) {
            ... on ProjectV2 {
                items(first: 100, after: $cursor) {
                    nodes {
                        id
                        content {
                            __typename
                            ... on Issue {
                                id
                                number
                                state
                                title
                                body
                                labels(first: 100) {
                                    nodes {
                                        name
                                    }
                                }
                            }
                            ... on PullRequest {
                                id
                                number
                                state
                                isDraft
                                title
                                body
                                baseRefName
                            }
                        }
                        fieldValues(first: 100) {
                            nodes {
                                __typename
                                ... on ProjectV2ItemFieldSingleSelectValue {
                                    field {
                                        ... on ProjectV2SingleSelectField {
                                            id
                                            name
                                        }
                                    }
                                    optionId
                                    name
                                }
                            }
                        }
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
        }
    }
`;

const ADD_ITEM_MUTATION = `
    mutation AddProjectItem($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(
            input: { projectId: $projectId, contentId: $contentId }
        ) {
            item {
                id
            }
        }
    }
`;

const UPDATE_ITEM_MUTATION = `
    mutation UpdateProjectItemStatus(
        $projectId: ID!
        $itemId: ID!
        $fieldId: ID!
        $optionId: String!
    ) {
        updateProjectV2ItemFieldValue(
            input: {
                projectId: $projectId
                itemId: $itemId
                fieldId: $fieldId
                value: { singleSelectOptionId: $optionId }
            }
        ) {
            projectV2Item {
                id
            }
        }
    }
`;

function normalizeState(state) {
    return String(state ?? '').toLowerCase();
}

function projectItemKey(content) {
    if (!content || !content.__typename || !content.number) {
        return null;
    }

    const prefix = content.__typename === 'PullRequest' ? 'pull' : 'issue';

    return `${prefix}:${content.number}`;
}

function mapIssueStatus(status) {
    const statusMap = {
        ready: 'Ready',
        blocked: 'Blocked',
        stacked: 'In progress',
        'in-progress': 'In progress',
        'needs-review': 'In review',
    };

    if (!statusMap[status]) {
        throw new Error(`Unsupported issue status: ${status}`);
    }

    return statusMap[status];
}

function mapIssueDeliveryStatus(issue, { allIssuesByNumber, pullRequests }) {
    if (normalizeState(issue.state) === 'closed') {
        return 'Done';
    }

    return mapIssueStatus(
        resolveStatus({
            issueNumber: issue.number,
            body: issue.body ?? '',
            allIssuesByNumber,
            pullRequests,
        }).status,
    );
}

function mapPullRequestDeliveryStatus(pullRequest) {
    if (normalizeState(pullRequest.state) === 'closed') {
        return 'Done';
    }

    return pullRequest.draft ? 'In progress' : 'In review';
}

function buildProjectStatusRecords({ issues, pullRequests }) {
    const allIssues = issues.filter((issue) => !issue.pull_request);
    const allIssuesByNumber = new Map(
        allIssues.map((issue) => [issue.number, issue]),
    );
    const openPullRequestsForIssues = pullRequests.filter(
        (pullRequest) => normalizeState(pullRequest.state) === 'open',
    );
    const records = new Map();

    for (const issue of allIssues) {
        records.set(`issue:${issue.number}`, {
            key: `issue:${issue.number}`,
            contentId: issue.node_id,
            number: issue.number,
            type: 'Issue',
            open: normalizeState(issue.state) === 'open',
            status: mapIssueDeliveryStatus(issue, {
                allIssuesByNumber,
                pullRequests: openPullRequestsForIssues,
            }),
        });
    }

    for (const pullRequest of pullRequests) {
        if (normalizeState(pullRequest.state) !== 'open') {
            continue;
        }

        records.set(`pull:${pullRequest.number}`, {
            key: `pull:${pullRequest.number}`,
            contentId: pullRequest.node_id,
            number: pullRequest.number,
            type: 'PullRequest',
            open: true,
            status: mapPullRequestDeliveryStatus(pullRequest),
        });
    }

    return records;
}

function selectDeliveryStatusField(fields) {
    const field = fields.find(
        (candidate) => candidate?.name === 'Delivery Status',
    );

    if (!field) {
        throw new Error(
            'Project field Delivery Status tidak ditemukan. Buat field SINGLE_SELECT tersebut sebelum menjalankan reconciliation.',
        );
    }

    const options = new Map(
        (field.options ?? []).map((option) => [option.name, option.id]),
    );
    const missing = DELIVERY_STATUSES.filter((status) => !options.has(status));

    if (missing.length > 0) {
        throw new Error(
            `Project field Delivery Status kehilangan option: ${missing.join(', ')}`,
        );
    }

    return { ...field, options };
}

function currentItemOptionId(item, fieldId) {
    const value = (item.fieldValues?.nodes ?? []).find(
        (candidate) => candidate?.field?.id === fieldId,
    );

    return value?.optionId ?? null;
}

function logInfo(core, message) {
    if (core?.info) {
        core.info(message);
    }
}

function logWarning(core, message) {
    if (core?.warning) {
        core.warning(message);
    }
}

async function graphql(github, query, variables) {
    try {
        return await github.graphql(query, variables);
    } catch (error) {
        const detail = error?.errors
            ?.map((entry) => entry.message)
            .filter(Boolean)
            .join('; ');
        const message = detail || error?.message || String(error);

        throw new Error(`GitHub Project GraphQL request failed: ${message}`);
    }
}

async function getProjectMetadata(github, owner, projectNumber) {
    const response = await graphql(github, PROJECT_METADATA_QUERY, {
        owner,
        number: projectNumber,
    });
    const project = response?.user?.projectV2;

    if (!project) {
        throw new Error(
            `Project ${owner}#${projectNumber} tidak ditemukan atau token tidak memiliki akses Projects.`,
        );
    }

    return project;
}

async function listProjectItems(github, projectId) {
    const items = [];
    let cursor = null;

    do {
        const response = await graphql(github, PROJECT_ITEMS_QUERY, {
            projectId,
            cursor,
        });
        const page = response?.node?.items;

        if (!page) {
            throw new Error(
                `Project ${projectId} items tidak dapat dibaca. Periksa permission Projects.`,
            );
        }

        items.push(...page.nodes);
        cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    } while (cursor);

    return items;
}

async function addProjectItem(github, projectId, contentId) {
    const response = await graphql(github, ADD_ITEM_MUTATION, {
        projectId,
        contentId,
    });
    const itemId = response?.addProjectV2ItemById?.item?.id;

    if (!itemId) {
        throw new Error(
            `Project item untuk content ${contentId} tidak dapat dibuat.`,
        );
    }

    return itemId;
}

async function updateProjectItemStatus(
    github,
    { projectId, itemId, fieldId, optionId },
) {
    await graphql(github, UPDATE_ITEM_MUTATION, {
        projectId,
        itemId,
        fieldId,
        optionId,
    });
}

function projectItemStatus(item, field) {
    return currentItemOptionId(item, field.id);
}

async function syncSatuProject({
    github,
    context,
    core,
    dryRun = false,
    projectOwner = process.env.SATU_PROJECT_OWNER,
    projectNumber = Number(process.env.SATU_PROJECT_NUMBER),
}) {
    if (
        !projectOwner ||
        !Number.isInteger(projectNumber) ||
        projectNumber < 1
    ) {
        throw new Error(
            'SATU_PROJECT_OWNER dan SATU_PROJECT_NUMBER wajib tersedia sebagai repository variables.',
        );
    }

    const { owner: repositoryOwner, repo } = context.repo;
    const [issues, pullRequests, project] = await Promise.all([
        github.paginate(github.rest.issues.listForRepo, {
            owner: repositoryOwner,
            repo,
            state: 'all',
            per_page: 100,
        }),
        github.paginate(github.rest.pulls.list, {
            owner: repositoryOwner,
            repo,
            state: 'open',
            per_page: 100,
        }),
        getProjectMetadata(github, projectOwner, projectNumber),
    ]);
    const field = selectDeliveryStatusField(
        project.fields.nodes.filter(
            (candidate) =>
                candidate?.__typename === 'ProjectV2SingleSelectField',
        ),
    );
    const projectItems = await listProjectItems(github, project.id);
    const records = buildProjectStatusRecords({ issues, pullRequests });
    const existingByKey = new Map();
    let duplicateExisting = 0;

    for (const item of projectItems) {
        const key = projectItemKey(item.content);

        if (!key) {
            continue;
        }

        if (existingByKey.has(key)) {
            duplicateExisting += 1;
            continue;
        }

        existingByKey.set(key, item);
    }

    const changes = [];
    let added = 0;
    let updated = 0;
    let unchanged = 0;
    let skipped = 0;

    async function reconcileItem(item, key, status) {
        const optionId = field.options.get(status);
        const currentOptionId = projectItemStatus(item, field);

        if (currentOptionId === optionId) {
            unchanged += 1;

            return;
        }

        changes.push({
            key,
            from: currentOptionId ?? 'none',
            to: status,
        });

        if (dryRun) {
            return;
        }

        await updateProjectItemStatus(github, {
            projectId: project.id,
            itemId: item.id,
            fieldId: field.id,
            optionId,
        });
        updated += 1;
    }

    for (const item of projectItems) {
        const content = item.content;
        const key = projectItemKey(content);

        if (!key) {
            skipped += 1;
            continue;
        }

        const record = records.get(key);
        let status = record?.status;

        if (normalizeState(content.state) === 'closed') {
            status = 'Done';
        }

        if (!status) {
            skipped += 1;
            logWarning(
                core,
                `Project item ${key} tidak memiliki source content yang dapat direkonsiliasi.`,
            );
            continue;
        }

        await reconcileItem(item, key, status);
    }

    for (const record of records.values()) {
        if (!record.open || existingByKey.has(record.key)) {
            continue;
        }

        if (dryRun) {
            changes.push({
                key: record.key,
                from: 'missing',
                to: record.status,
            });
            added += 1;
            continue;
        }

        const itemId = await addProjectItem(
            github,
            project.id,
            record.contentId,
        );
        added += 1;
        await reconcileItem(
            {
                id: itemId,
                fieldValues: { nodes: [] },
            },
            record.key,
            record.status,
        );
    }

    const result = {
        project: `${projectOwner}#${projectNumber}`,
        dryRun,
        added,
        updated,
        unchanged,
        skipped,
        duplicateExisting,
        changes,
    };

    logInfo(
        core,
        `${dryRun ? 'Dry run found' : 'Synchronized'} ${
            changes.length
        } Project change(s) for ${result.project}.`,
    );

    if (core?.summary) {
        core.summary.addHeading(
            `SATU Delivery Project sync${dryRun ? ' (dry run)' : ''}`,
        );
        core.summary.addTable([
            [
                { data: 'Metric', header: true },
                { data: 'Count', header: true },
            ],
            ['Added', String(added)],
            ['Updated', String(updated)],
            ['Unchanged', String(unchanged)],
            ['Skipped', String(skipped)],
            ['Existing duplicates detected', String(duplicateExisting)],
        ]);
        await core.summary.write();
    }

    return result;
}

module.exports = {
    DELIVERY_STATUSES,
    PROJECT_ITEMS_QUERY,
    PROJECT_METADATA_QUERY,
    ADD_ITEM_MUTATION,
    UPDATE_ITEM_MUTATION,
    normalizeState,
    projectItemKey,
    mapIssueStatus,
    mapIssueDeliveryStatus,
    mapPullRequestDeliveryStatus,
    buildProjectStatusRecords,
    selectDeliveryStatusField,
    currentItemOptionId,
    syncSatuProject,
};
