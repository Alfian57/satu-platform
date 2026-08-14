export type User = {
    id: number;
    name: string;
    username: string;
    avatar?: string;
    is_platform_admin?: boolean;
    workspace: UserWorkspace;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type WorkspaceRole =
    'platform_admin' | 'campus_admin' | 'recruiter' | 'student';

export type WorkspaceEntity = {
    id: number;
    name: string;
};

export type UserWorkspace = {
    role: WorkspaceRole;
    institution: WorkspaceEntity | null;
    recruiterOrganization: WorkspaceEntity | null;
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
