const STATUS_LABELS = [
    'ready',
    'blocked',
    'stacked',
    'in-progress',
    'needs-review',
];

function parseBlockedBy(body = '') {
    const match = body.match(/^\s*-\s*\*\*Blocked by:\*\*\s*(.+)$/im);

    if (!match) {
        return [];
    }

    const value = match[1].trim();

    if (
        /^(none|n\/a|tidak ada(?: hard dependency)?|no hard dependency)\.?$/i.test(
            value,
        )
    ) {
        return [];
    }

    const issueNumbers = [...value.matchAll(/#(\d+)/g)].map((result) =>
        Number(result[1]),
    );

    if (issueNumbers.length === 0) {
        throw new Error(
            `Blocked by field does not contain an issue reference: ${value}`,
        );
    }

    return [...new Set(issueNumbers)];
}

function pullRequestReferencesIssue(pullRequest, issueNumber) {
    const body = pullRequest.body ?? '';
    const closingReference =
        /\b(?:close(?:s|d)?|fix(?:es|ed)?|resolve(?:s|d)?)\s+#(\d+)\b/gi;

    return [...body.matchAll(closingReference)].some(
        (match) => Number(match[1]) === issueNumber,
    );
}

function parseStackedOn(body = '') {
    const match = body.match(/^\s*-\s*(?:\*\*)?Stacked on:(?:\*\*)?\s*(.+)$/im);

    if (!match) {
        return null;
    }

    const value = match[1].trim();

    if (/^(none|n\/a|tidak ada)\.?$/i.test(value)) {
        return null;
    }

    const issueNumbers = [...value.matchAll(/#(\d+)/g)].map((result) =>
        Number(result[1]),
    );

    if (issueNumbers.length !== 1) {
        throw new Error(
            `Stacked on field must contain exactly one issue reference: ${value}`,
        );
    }

    return issueNumbers[0];
}

function hasIssueLabel(issue, labelName) {
    return (issue?.labels ?? []).some(
        (label) => (label?.name ?? label) === labelName,
    );
}

function pullRequestIsStackedForIssue(
    pullRequest,
    blockerNumbers,
    allIssuesByNumber,
) {
    if ((pullRequest.base?.ref ?? 'main') === 'main') {
        return false;
    }

    const parentNumber = parseStackedOn(pullRequest.body ?? '');

    if (!parentNumber || !blockerNumbers.includes(parentNumber)) {
        return false;
    }

    const parentIssue = allIssuesByNumber.get(parentNumber);

    return (
        parentIssue?.state === 'open' &&
        hasIssueLabel(parentIssue, 'contract-ready')
    );
}

function pullRequestStatus(
    issueNumber,
    pullRequests,
    { blockerNumbers = [], allIssuesByNumber = new Map() } = {},
) {
    const relatedPullRequests = pullRequests.filter((pullRequest) =>
        pullRequestReferencesIssue(pullRequest, issueNumber),
    );

    if (
        blockerNumbers.length > 0 &&
        relatedPullRequests.some((pullRequest) =>
            pullRequestIsStackedForIssue(
                pullRequest,
                blockerNumbers,
                allIssuesByNumber,
            ),
        )
    ) {
        return 'stacked';
    }

    if (relatedPullRequests.some((pullRequest) => !pullRequest.draft)) {
        return 'needs-review';
    }

    if (relatedPullRequests.some((pullRequest) => pullRequest.draft)) {
        return 'in-progress';
    }

    return null;
}

function resolveStatus({ issueNumber, body, allIssuesByNumber, pullRequests }) {
    const blockerNumbers = parseBlockedBy(body);
    const openBlockers = blockerNumbers.filter((number) => {
        const dependency = allIssuesByNumber.get(number);

        if (!dependency) {
            throw new Error(
                `Blocked by references missing issue #${number} on issue #${issueNumber}`,
            );
        }

        return dependency.state === 'open';
    });

    const pullRequestStatusValue = pullRequestStatus(
        issueNumber,
        pullRequests,
        {
            blockerNumbers,
            allIssuesByNumber,
        },
    );

    if (openBlockers.length > 0) {
        return {
            status:
                pullRequestStatusValue === 'stacked' ? 'stacked' : 'blocked',
            blockerNumbers,
            openBlockers,
        };
    }

    return {
        status: pullRequestStatusValue ?? 'ready',
        blockerNumbers,
        openBlockers,
    };
}

async function syncIssueStatuses({ github, context, core, dryRun = false }) {
    const { owner, repo } = context.repo;
    const allIssues = await github.paginate(github.rest.issues.listForRepo, {
        owner,
        repo,
        state: 'all',
        per_page: 100,
    });
    const openPullRequests = await github.paginate(github.rest.pulls.list, {
        owner,
        repo,
        state: 'open',
        per_page: 100,
    });
    const allIssuesByNumber = new Map(
        allIssues
            .filter((issue) => !issue.pull_request)
            .map((issue) => [issue.number, issue]),
    );
    const openIssues = [...allIssuesByNumber.values()].filter(
        (issue) => issue.state === 'open',
    );
    const changes = [];
    const malformed = [];

    for (const issue of openIssues) {
        let resolution;

        try {
            resolution = resolveStatus({
                issueNumber: issue.number,
                body: issue.body ?? '',
                allIssuesByNumber,
                pullRequests: openPullRequests,
            });
        } catch (error) {
            malformed.push({
                issue: issue.number,
                error: error.message,
            });
            continue;
        }

        const existingLabels = issue.labels.map((label) => label.name);
        const currentStatuses = existingLabels.filter((label) =>
            STATUS_LABELS.includes(label),
        );
        const nextLabels = [
            ...existingLabels.filter((label) => !STATUS_LABELS.includes(label)),
            resolution.status,
        ];

        if (
            currentStatuses.length === 1 &&
            currentStatuses[0] === resolution.status
        ) {
            continue;
        }

        changes.push({
            issue: issue.number,
            from: currentStatuses,
            to: resolution.status,
            blockers: resolution.openBlockers,
        });

        if (!dryRun) {
            await github.rest.issues.setLabels({
                owner,
                repo,
                issue_number: issue.number,
                labels: nextLabels,
            });
        }
    }

    const closedIssues = [...allIssuesByNumber.values()].filter(
        (issue) => issue.state !== 'open',
    );

    for (const issue of closedIssues) {
        const existingLabels = issue.labels.map((label) => label.name);
        const statusLabels = existingLabels.filter((label) =>
            STATUS_LABELS.includes(label),
        );

        if (statusLabels.length === 0) {
            continue;
        }

        const nextLabels = existingLabels.filter(
            (label) => !STATUS_LABELS.includes(label),
        );

        changes.push({
            issue: issue.number,
            from: statusLabels,
            to: 'none',
            blockers: [],
        });

        if (!dryRun) {
            await github.rest.issues.setLabels({
                owner,
                repo,
                issue_number: issue.number,
                labels: nextLabels,
            });
        }
    }

    core.info(
        `${dryRun ? 'Dry run found' : 'Synchronized'} ${changes.length} issue status change(s).`,
    );

    if (core.summary) {
        core.summary.addHeading(
            `Issue status sync${dryRun ? ' (dry run)' : ''}`,
        );
        core.summary.addTable([
            [
                { data: 'Issue', header: true },
                { data: 'Previous', header: true },
                { data: 'Next', header: true },
                { data: 'Open blockers', header: true },
            ],
            ...changes.map((change) => [
                `#${change.issue}`,
                change.from.join(', ') || 'none',
                change.to,
                change.blockers.map((number) => `#${number}`).join(', ') ||
                    'none',
            ]),
        ]);

        if (malformed.length > 0) {
            core.summary.addHeading(
                `Skipped issues with malformed dependency fields (${malformed.length})`,
                3,
            );
            core.summary.addTable([
                [
                    { data: 'Issue', header: true },
                    { data: 'Error', header: true },
                ],
                ...malformed.map((entry) => [
                    `#${entry.issue}`,
                    entry.error,
                ]),
            ]);
        }

        await core.summary.write();
    }

    for (const entry of malformed) {
        core.warning(
            `Issue #${entry.issue} skipped: ${entry.error}`,
        );
    }

    if (malformed.length > 0) {
        core.setFailed(
            `${malformed.length} issue(s) had malformed dependency fields and were skipped: ${malformed
                .map((entry) => `#${entry.issue}`)
                .join(', ')}`,
        );
    }

    return changes;
}

module.exports = {
    STATUS_LABELS,
    parseBlockedBy,
    parseStackedOn,
    hasIssueLabel,
    pullRequestReferencesIssue,
    pullRequestIsStackedForIssue,
    pullRequestStatus,
    resolveStatus,
    syncIssueStatuses,
};
