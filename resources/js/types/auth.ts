export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
};

export type AuthenticatedAuth = {
    user: User;
};

export type InstitutionMembershipStatus =
    'unverified' | 'pending' | 'verified' | 'suspended';

export type InstitutionMembershipSummary = {
    institutionName: string;
    status: InstitutionMembershipStatus;
};

export type ShellContext = {
    institutionMembership: InstitutionMembershipSummary | null;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */
