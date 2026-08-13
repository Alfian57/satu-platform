export type PortfolioVisibility =
    'private' | 'institution' | 'recruiter' | 'public';

export type PortfolioVerificationLevel =
    'self_reported' | 'team_confirmed' | 'institution_verified';

export type PortfolioEntryStatus =
    'private' | 'published' | 'withdrawn' | 'source_unavailable';

export type PortfolioEntry = {
    id: number;
    title: string;
    summary: string;
    verification_level: PortfolioVerificationLevel;
    verification_label: string;
    visibility: PortfolioVisibility;
    status: PortfolioEntryStatus;
    source: {
        type: 'approved_contribution';
        contribution_id: number;
        version_id: number;
        version_number: number | null;
        status: string | null;
    };
    published_at: string | null;
    withdrawn_at: string | null;
    updated_at: string;
};

export type PortfolioProfile = {
    id: number;
    institution: {
        id: number;
        name: string;
    };
    portfolio_visibility: PortfolioVisibility;
    recruiter_discoverable: boolean;
    updated_at: string;
};

export type PortfolioProfileVisibilityPayload = {
    portfolio_visibility: PortfolioVisibility;
    recruiter_discoverable: boolean;
    expected_updated_at?: string;
};

export type PortfolioEntryVisibilityPayload = {
    visibility: PortfolioVisibility;
    expected_updated_at?: string;
};

export type PortfolioIndexPageProps = {
    profile: PortfolioProfile | null;
    permissions: {
        can_manage: boolean;
    };
    entries?: PortfolioEntry[];
};

export type PortfolioShowPageProps = {
    entry: PortfolioEntry;
    profile: PortfolioProfile | null;
    permissions: {
        can_manage: boolean;
        can_manage_profile: boolean;
    };
};

export type PortfolioEntryApiResponse = {
    data: PortfolioEntry;
};

export type PortfolioProfileApiResponse = {
    data: Pick<
        PortfolioProfile,
        'id' | 'portfolio_visibility' | 'recruiter_discoverable' | 'updated_at'
    >;
};
