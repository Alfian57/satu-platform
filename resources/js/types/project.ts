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
    roles: ProjectRole[];
    created_at: string;
    updated_at: string;
};

export type ProjectApiResponse = {
    data: ProjectDetail;
};

export type ProjectFormRole = {
    title: string;
    description: string;
    capacity: number;
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
