export type ContributionStatus =
    'draft' | 'pending' | 'revision' | 'approved' | 'rejected' | 'archived';

export type ContributionTask = {
    id: number;
    title: string;
    status: string;
};

export type ContributionEvidenceOption = {
    id: number;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    created_at: string;
};

export type ContributionProjectOption = {
    id: number;
    title: string;
    status: string;
    tasks: ContributionTask[];
    evidence: ContributionEvidenceOption[];
};

export type ContributionSummary = {
    id: number;
    project: {
        id: number;
        title: string;
    };
    status: ContributionStatus;
    current_version: {
        id: number;
        version_number: number;
        task: {
            id: number;
            title: string;
        } | null;
    } | null;
    created_at: string;
    updated_at: string;
};

export type ContributionEvidence = {
    id: number;
    attachment_id: number;
    source_label: string;
    notes: string | null;
    available: boolean;
    attachment: {
        id: number;
        original_name: string;
        mime_type: string;
        size_bytes: number;
    } | null;
};

export type ContributionVersion = {
    id: number;
    version_number: number;
    claim: string;
    summary: string;
    declaration: string;
    task: {
        id: number;
        title: string;
    };
    created_by: {
        id: number;
        name: string;
    };
    evidence: ContributionEvidence[];
    created_at: string;
};

export type ContributionReview = {
    id: number;
    contribution_version_id: number;
    reviewer: {
        id: number;
        name: string;
    };
    decision: 'approved' | 'revision' | 'rejected';
    policy_version: string;
    reason: string | null;
    note: string | null;
    reviewed_at: string;
    created_at: string;
};

export type ContributionDetail = {
    id: number;
    project: {
        id: number;
        title: string;
    };
    owner: {
        id: number;
        name: string;
    };
    status: ContributionStatus;
    current_version_id: number | null;
    current_version: ContributionVersion | null;
    versions: ContributionVersion[];
    reviews: ContributionReview[];
    created_at: string;
    updated_at: string;
};

export type ContributionReviewQueueVersion = Omit<
    ContributionVersion,
    'task'
> & {
    task: {
        id: number;
        title: string;
    } | null;
};

export type ContributionReviewQueueItem = {
    id: number;
    reference: string;
    project: {
        id: number;
        title: string;
    };
    contributor: {
        id: number;
        name: string;
    };
    status: ContributionStatus;
    updated_at: string;
    current_version: ContributionReviewQueueVersion | null;
    reviews: ContributionReview[];
};

export type ContributionComposerValues = {
    project_id: number;
    task_id: number | '';
    claim: string;
    summary: string;
    declaration: string;
    evidence: number[];
};

export type ContributionPayload = Omit<
    ContributionComposerValues,
    'project_id'
>;

export type ContributionApiResponse = {
    data: ContributionDetail;
};
