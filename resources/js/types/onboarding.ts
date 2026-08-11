export type OnboardingAccount = {
    username: string;
};

export type OnboardingInstitution = {
    id: number;
    name: string;
};

export type OnboardingMembershipStatus =
    'unverified' | 'pending' | 'verified' | 'suspended';

export type OnboardingMembership = {
    institutionId: number;
    institutionName: string;
    status: OnboardingMembershipStatus;
};

export type OnboardingAffiliationStatus =
    'pending_review' | 'verified' | 'revision_required' | 'rejected';

export type OnboardingAffiliation = {
    status: OnboardingAffiliationStatus;
    submittedAt: string;
    needsRefresh: boolean;
};

export type OnboardingPhone = {
    masked: string;
    verified: boolean;
};

export type OnboardingPageProps = {
    account: OnboardingAccount;
    institutions: OnboardingInstitution[];
    membership: OnboardingMembership | null;
    studentProfileId: number | null;
    affiliation: OnboardingAffiliation | null;
    phone: OnboardingPhone | null;
    canRequest: boolean;
    canRetry: boolean;
    membershipOutcome: OnboardingMembershipStatus | null;
    affiliationOutcome: OnboardingAffiliationStatus | null;
    submissionIssue: 'session_expired' | 'forbidden' | 'phone_required' | null;
};
