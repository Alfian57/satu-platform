const STATUS_LABELS = ['ready', 'blocked', 'in-progress', 'needs-review'];

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

function pullRequestStatus(issueNumber, pullRequests) {
    const relatedPullRequests = pullRequests.filter((pullRequest) =>
        pullRequestReferencesIssue(pullRequest, issueNumber),
    );

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

    if (openBlockers.length > 0) {
        return {
            status: 'blocked',
            blockerNumbers,
            openBlockers,
        };
    }

    return {
        status: pullRequestStatus(issueNumber, pullRequests) ?? 'ready',
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
        base: 'main',
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

    for (const issue of openIssues) {
        const resolution = resolveStatus({
            issueNumber: issue.number,
            body: issue.body ?? '',
            allIssuesByNumber,
            pullRequests: openPullRequests,
        });
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
        await core.summary.write();
    }

    return changes;
}

module.exports = {
    STATUS_LABELS,
    parseBlockedBy,
    pullRequestReferencesIssue,
    pullRequestStatus,
    resolveStatus,
    syncIssueStatuses,
};
