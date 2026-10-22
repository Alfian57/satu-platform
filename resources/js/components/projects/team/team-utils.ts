import type {
    ProjectRole,
    TeamFormationState,
    TeamJoinRequest,
} from '@/types/project';

export type TeamFormationProps = {
    projectId: number;
    roles: ProjectRole[];
    team: TeamFormationState;
    canWorkspace?: boolean;
    onAccessDenied?: () => void;
};

export type CommandResponse = { data: Record<string, unknown> };

export type Application = {
    project_role_id: number | null;
    interest: string;
    skills: string;
    availability: string;
};

export type Decision = {
    kind:
        | 'accept-invitation'
        | 'reject-invitation'
        | 'revoke-invitation'
        | 'accept-request'
        | 'reject-request'
        | 'withdraw-request';
    id: number;
    person: string;
    revision?: string;
    role?: TeamJoinRequest['role'];
};

export const emptyApplication: Application = {
    project_role_id: null,
    interest: '',
    skills: '',
    availability: '',
};

export const reloadKeys = [
    'team',
    'project',
    'can_edit',
    'can_transition',
    'can_workspace',
];

export const textAreaClass =
    'min-h-20 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50';

export function firstError(errors: Record<string, unknown>): string | null {
    const error = Object.values(errors)[0];

    return typeof error === 'string'
        ? error
        : Array.isArray(error) && typeof error[0] === 'string'
          ? error[0]
          : null;
}

export function formatDate(value: string): string {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Tanggal belum tersedia'
        : new Intl.DateTimeFormat('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          }).format(date);
}

export function focusTeam(): void {
    document.getElementById('team-formation-title')?.focus();
}
