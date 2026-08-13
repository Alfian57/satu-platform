export type WorkspaceRealtimeDelta = {
    resource: 'task' | 'discussion';
    operation: string;
    resource_id: number;
    project_id: number;
    institution_id: number;
    version: string | null;
    occurred_at: string;
};

export type WorkspacePresenceMember = {
    id: number | string;
    name: string;
};

export type WorkspaceRealtimeStatus =
    | 'connected'
    | 'connecting'
    | 'reconnecting'
    | 'disconnected'
    | 'unavailable'
    | 'offline';
