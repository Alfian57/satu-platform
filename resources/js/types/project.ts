import type { CapacityStats } from '@/lib/project-opportunities';

export type ProjectStatus =
    'draft' | 'open' | 'forming' | 'full' | 'closed' | 'cancelled' | 'archived';

export type ProjectVisibility = 'private' | 'institution' | 'public';

export type ProjectSkill = {
    id?: number;
    taxonomy_id: number;
    name?: string;
    proficiency: string;
};

export type ProjectRole = {
    id: number;
    title: string;
    description: string | null;
    capacity: number;
    accepts_beginners?: boolean | null;
    selection_criteria?: string | null;
    capacity_stats?: CapacityStats;
    skills: ProjectSkill[];
};

export type ProjectInstitution = {
    id: number;
    name: string;
};

export type ProjectDetail = {
    id: number;
    institution_id: number;
    institution: ProjectInstitution;
    owner_id: number;
    owner: {
        id: number;
        name: string;
    };
    title: string;
    description: string | null;
    status: ProjectStatus | string;
    visibility: ProjectVisibility | string;
    capacity: number;
    deadline: string;
    capacity_stats?: CapacityStats;
    roles: ProjectRole[];
    created_at: string;
    updated_at: string;
};

export type ProjectApiResponse = {
    data: ProjectDetail;
};

export type ProjectFormRole = {
    id?: number;
    title: string;
    description: string;
    capacity: number;
    accepts_beginners: boolean | null;
    selection_criteria: string;
    skills: ProjectSkill[];
};

export type ProjectFormData = {
    institution_id?: number;
    title: string;
    description: string;
    visibility: ProjectVisibility;
    capacity: number;
    deadline: string;
    roles: ProjectFormRole[];
    expected_updated_at?: string;
};

export type ProjectTransitionData = {
    reason: string;
    occupied_capacity?: number;
    expected_updated_at?: string;
};

export type TeamPerson = {
    id: number;
    name: string;
};

export type TeamRoleReference = {
    id: number;
    title: string;
};

export type TeamCapacity = {
    total: number;
    occupied: number;
    remaining: number;
    state: 'open' | 'full' | 'closed' | string;
    is_full: boolean;
};

export type TeamInvitation = {
    id: number;
    project_role_id: number | null;
    role: TeamRoleReference | null;
    person: TeamPerson | null;
    status:
        'pending' | 'accepted' | 'rejected' | 'expired' | 'revoked' | string;
    expires_at: string;
    is_expired: boolean;
};

export type TeamJoinRequest = {
    id: number;
    project_role_id: number | null;
    role: (TeamRoleReference & { selection_criteria?: string | null }) | null;
    requester: TeamPerson | null;
    status:
        'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | string;
    message: string | null;
    requested_at: string;
    responded_at?: string | null;
    response_reason?: string | null;
    revision?: string;
    can_accept?: boolean;
    shared_work?: {
        id: number;
        title: string;
        summary: string;
        verification_label: string;
    }[];
};

export type TeamMembership = {
    id: number;
    user: TeamPerson | null;
    role: TeamRoleReference | null;
    status: 'active' | 'left' | 'removed' | string;
    joined_at: string | null;
};

export type TeamFormationState = {
    capacity: TeamCapacity;
    permissions: {
        can_request_join: boolean;
        can_manage_requests: boolean;
        can_manage_invitations: boolean;
        can_leave: boolean;
        can_withdraw?: boolean;
    };
    current_membership: TeamMembership | null;
    pending_invitations: TeamInvitation[];
    pending_join_request: TeamJoinRequest | null;
    join_requests: TeamJoinRequest[];
    sent_invitations: TeamInvitation[];
    active_members: TeamMembership[];
    request_history?: {
        data: TeamJoinRequest[];
        current_page: number;
        last_page: number;
    };
};
