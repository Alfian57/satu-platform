import type {
    DiscussionPage,
    TaskPage,
    TaskPriority,
    TaskStatus,
    TaskWorkspaceFilters,
    TaskWorkspacePermissions,
    WorkspaceEvidencePage,
    WorkspaceMember,
    WorkspacePerson,
    WorkspaceProject,
    WorkspaceTask,
} from '@/types';

export type CreateTaskData = {
    title: string;
    description: string;
    priority: TaskPriority;
    due_at: string;
};

export type UpdateTaskData = CreateTaskData & {
    expected_revision: string;
};

export type TransitionTaskData = {
    status: TaskStatus;
    expected_revision: string;
};

export type AssignmentData = {
    assignee_id: number | '';
    expected_revision: string;
};

export type DeleteTaskData = { expected_revision: string };

export type TaskResponse = {
    data: WorkspaceTask;
};

export type AssignmentResponse = {
    data: {
        id: number;
        task_id: number;
        user: WorkspacePerson;
    };
};

export type DeleteResponse = {
    data: {
        deleted: boolean;
        task_id: number;
    };
};

export type RealtimeReconciliationScope =
    'workspace' | 'tasks' | 'discussion' | 'evidence';

export type ReconciliationReason =
    'delta' | 'reconnect' | 'manual' | 'stale' | 'command';

export type WorkspaceRecoveryAction = 'reload' | 'stale';

export type WorkspaceProps = {
    project: WorkspaceProject;
    tasks: TaskPage;
    discussion: DiscussionPage;
    evidence: WorkspaceEvidencePage;
    members: WorkspaceMember[];
    filters: TaskWorkspaceFilters;
    permissions: TaskWorkspacePermissions;
};

export type ErrorMap = Record<string, unknown>;

export const statusLabels: Record<TaskStatus, string> = {
    todo: 'Belum mulai',
    in_progress: 'Sedang dikerjakan',
    blocked: 'Terblokir',
    done: 'Selesai',
};

export const priorityLabels: Record<TaskPriority, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    urgent: 'Mendesak',
};

export const statusOptions: TaskStatus[] = [
    'todo',
    'in_progress',
    'blocked',
    'done',
];

export const priorityOptions: TaskPriority[] = [
    'low',
    'medium',
    'high',
    'urgent',
];

export const transitions: Record<TaskStatus, TaskStatus[]> = {
    todo: ['in_progress', 'blocked', 'done'],
    in_progress: ['todo', 'blocked', 'done'],
    blocked: ['todo', 'in_progress'],
    done: ['todo', 'in_progress'],
};

export const statusClasses: Record<TaskStatus, string> = {
    todo: 'border-border bg-muted text-muted-foreground',
    in_progress: 'border-primary/35 bg-primary/10 text-primary',
    blocked:
        'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    done: 'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
};

export const priorityClasses: Record<TaskPriority, string> = {
    low: 'text-muted-foreground',
    medium: 'text-primary',
    high: 'font-medium text-pending-subtle-foreground',
    urgent: 'font-medium text-correction-subtle-foreground',
};

export const selectClassName =
    'h-control-md w-full cursor-pointer rounded-md border border-input bg-background pl-4 pr-10 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

export const textAreaClassName =
    'min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger placeholder:text-muted-foreground hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

export function dateTimeLocalValue(value: string | null): string {
    if (value === null) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value.slice(0, 16);
    }

    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
    );

    return localDate.toISOString().slice(0, 16);
}

export function formatDateTime(value: string | null): string {
    if (value === null) {
        return 'Belum ditentukan';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

export function submittedDueAt(value: string): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function firstError(
    errors: ErrorMap,
    field: string,
): string | undefined {
    const value = errors[field];

    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : undefined;
    }

    return typeof value === 'string' ? value : undefined;
}

export function requestFailureMessage(status: number): string {
    if (status === 403) {
        return 'Akses perubahan tugas sudah tidak tersedia. Muat ulang workspace untuk menyegarkan izin.';
    }

    if (status === 404) {
        return 'Tugas sudah tidak tersedia. Muat ulang workspace untuk mendapatkan daftar terbaru.';
    }

    if (status === 409) {
        return 'Tugas berubah di sesi lain. Muat ulang data terbaru sebelum menyimpan kembali.';
    }

    return 'Hasil perubahan belum dapat dipastikan. Periksa data terbaru sebelum mengirim lagi.';
}
