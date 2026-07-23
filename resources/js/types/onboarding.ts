export type OnboardingAccount = {
    email: string;
    emailVerified: boolean;
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

export type OnboardingPageProps = {
    account: OnboardingAccount;
    institutions: OnboardingInstitution[];
    membership: OnboardingMembership | null;
    canRequest: boolean;
    canRetry: boolean;
    membershipOutcome: OnboardingMembershipStatus | null;
    submissionIssue: 'session_expired' | null;
};
