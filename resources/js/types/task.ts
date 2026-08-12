export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type WorkspacePerson = {
    id: number;
    name: string;
};

export type WorkspaceMember = WorkspacePerson & {
    role: string;
};

export type TaskAssignment = {
    id: number;
    user: WorkspacePerson;
};

export type WorkspaceTask = {
    id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_at: string | null;
    is_overdue: boolean;
    created_by: WorkspacePerson;
    assignments: TaskAssignment[];
    created_at: string;
    updated_at: string;
};

export type WorkspaceProject = {
    id: number;
    institution_id: number;
    title: string;
    status: string;
    deadline: string;
    owner: WorkspacePerson;
};

export type WorkspaceAttachmentPurpose = 'attachment' | 'evidence';

export type WorkspaceAttachment = {
    id: number;
    purpose: WorkspaceAttachmentPurpose;
    message_id: number | null;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    uploaded_by: WorkspacePerson;
    created_at: string;
    updated_at: string;
};

export type WorkspaceDiscussion = {
    id: number;
    body: string;
    author: WorkspacePerson;
    attachments: WorkspaceAttachment[];
    is_edited: boolean;
    created_at: string;
    updated_at: string;
};

export type DiscussionPage = {
    data: WorkspaceDiscussion[];
    links: Array<Record<string, unknown>>;
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
};

export type TaskPage = {
    data: WorkspaceTask[];
    links: Array<Record<string, unknown>>;
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
};

export type TaskWorkspaceFilters = {
    q: string;
    status: TaskStatus | null;
    priority: TaskPriority | null;
    per_page: number;
    page: number;
};

export type TaskWorkspacePermissions = {
    can_create: boolean;
    can_manage_tasks: boolean;
};
