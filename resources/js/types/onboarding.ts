export type OnboardingMembershipStatus =
    'unverified' | 'pending' | 'verified' | 'suspended';

export type OnboardingAffiliationStatus =
    'pending_review' | 'verified' | 'revision_required' | 'rejected';

export type StudentActivation = {
    required: boolean;
    universityState: 'ready' | 'missing' | 'invalid' | 'unavailable';
    institutionId: number | null;
    institutionName: string | null;
    membershipStatus: OnboardingMembershipStatus;
    affiliationStatus: OnboardingAffiliationStatus | null;
    matchResult:
        | 'exact'
        | 'no_match'
        | 'ambiguous'
        | 'inactive'
        | 'roster_unavailable'
        | 'stale_roster'
        | null;
    phoneVerified: boolean;
    hasLegacyAffiliation: boolean;
    canSubmitAffiliation: boolean;
    needsRosterRefresh: boolean;
    profileId: number | null;
    studyProgram: string;
    faculty: string;
    admissionYear: number | null;
    academicOptions: Record<string, string[]>;
    bio: string;
    skillsCount: number;
    availabilityCount: number;
    nim: string;
};
