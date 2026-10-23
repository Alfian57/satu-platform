export interface InclusionReviewItem {
    id: number;
    inclusion_signal_id: number;
    reviewer_id: number;
    reviewer_name?: string;
    human_conclusion: string;
    support_action?: string | null;
    reason: string;
    created_at?: string;
}

export interface InclusionSignalItem {
    id: number;
    institution_id: number;
    subject_id: number;
    subject_name?: string;
    version_id: number;
    version?: string;
    period: string;
    restricted_feature_state: boolean;
    data_sufficiency_met: boolean;
    evidence_summary?: Record<string, unknown> | null;
    created_at?: string;
    reviews: InclusionReviewItem[];
}

export interface PaginatedSignals {
    items: InclusionSignalItem[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface CampusInclusionProps {
    institution: {
        id: number;
        name: string;
    };
    engineActive: boolean;
    signals: PaginatedSignals;
    filters: {
        period: string | null;
        restricted_only: boolean;
    };
    selectedSignal: InclusionSignalItem | null;
}

export const conclusions: Record<string, string> = {
    acknowledged: 'Telah ditinjau',
    dismissed: 'Sinyal tidak relevan',
    outreach_recorded: 'Tindakan pendukung tercatat',
};
