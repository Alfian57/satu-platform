import { Head, Link, router, useHttp } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarClock,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleDot,
    ClipboardList,
    Clock3,
    Filter,
    LockKeyhole,
    Plus,
    RefreshCw,
    Save,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProjectWorkspaceController from '@/actions/App/Http/Controllers/ProjectWorkspaceController';
import { AppPage } from '@/components/app-page';
import InputError from '@/components/input-error';
import { WorkspaceDiscussion } from '@/components/projects/workspace-discussion';
import { WorkspaceRealtimeStatus } from '@/components/projects/workspace-realtime-status';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useWorkspaceRealtime } from '@/hooks/use-workspace-realtime';
import { cn } from '@/lib/utils';
import { index as projectsIndex, show as projectShow } from '@/routes/projects';
import type {
    TaskPage,
    TaskPriority,
    TaskStatus,
    TaskWorkspaceFilters,
    TaskWorkspacePermissions,
    DiscussionPage,
    WorkspaceMember,
    WorkspacePerson,
    WorkspaceProject,
    WorkspaceTask,
} from '@/types';

type CreateTaskData = {
    title: string;
    description: string;
    priority: TaskPriority;
    due_at: string;
};

type UpdateTaskData = CreateTaskData & {
    expected_updated_at: string;
};

type TransitionTaskData = {
    status: TaskStatus;
    expected_updated_at: string;
};

type AssignmentData = {
    assignee_id: number | '';
};

type DeleteTaskData = Record<string, never>;

type TaskResponse = {
    data: WorkspaceTask;
};

type AssignmentResponse = {
    data: {
        id: number;
        task_id: number;
        user: WorkspacePerson;
    };
};

type DeleteResponse = {
    data: {
        deleted: boolean;
        task_id: number;
    };
};

type WorkspaceProps = {
    project: WorkspaceProject;
    tasks: TaskPage;
    discussion: DiscussionPage;
    members: WorkspaceMember[];
    filters: TaskWorkspaceFilters;
    permissions: TaskWorkspacePermissions;
};

type RealtimeReconciliationScope = 'workspace' | 'tasks' | 'discussion';

type ReconciliationReason =
    'delta' | 'reconnect' | 'manual' | 'stale' | 'command';

type WorkspaceRecoveryAction = 'retry' | 'reload' | 'stale';

type ErrorMap = Record<string, unknown>;

const statusLabels: Record<TaskStatus, string> = {
    todo: 'Belum mulai',
    in_progress: 'Sedang dikerjakan',
    blocked: 'Terblokir',
    done: 'Selesai',
};

const priorityLabels: Record<TaskPriority, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    urgent: 'Mendesak',
};

const statusOptions: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done'];

const priorityOptions: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

const transitions: Record<TaskStatus, TaskStatus[]> = {
    todo: ['in_progress', 'blocked', 'done'],
    in_progress: ['todo', 'blocked', 'done'],
    blocked: ['todo', 'in_progress'],
    done: ['todo', 'in_progress'],
};

const statusClasses: Record<TaskStatus, string> = {
    todo: 'border-border bg-muted text-muted-foreground',
    in_progress: 'border-primary/35 bg-primary/10 text-primary',
    blocked:
        'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    done: 'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
};

const priorityClasses: Record<TaskPriority, string> = {
    low: 'text-muted-foreground',
    medium: 'text-primary',
    high: 'font-medium text-pending-subtle-foreground',
    urgent: 'font-medium text-correction-subtle-foreground',
};

const selectClassName =
    'h-control-md w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50';

const textAreaClassName =
    'min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger placeholder:text-muted-foreground hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

function dateTimeLocalValue(value: string | null): string {
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

function formatDateTime(value: string | null): string {
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
        timeZone: 'UTC',
    }).format(date);
}

function firstError(errors: ErrorMap, field: string): string | undefined {
    const value = errors[field];

    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : undefined;
    }

    return typeof value === 'string' ? value : undefined;
}

function requestFailureMessage(status: number): string {
    if (status === 403) {
        return 'Akses perubahan task sudah tidak tersedia. Muat ulang workspace untuk menyegarkan permission.';
    }

    if (status === 404) {
        return 'Task sudah tidak tersedia. Muat ulang workspace untuk mendapatkan daftar terbaru.';
    }

    if (status === 409) {
        return 'Task berubah di sesi lain. Muat ulang data terbaru sebelum menyimpan kembali.';
    }

    return 'Perubahan belum tersimpan. Periksa field yang ditandai lalu coba lagi.';
}

function StatusMark({
    status,
    compact = false,
}: {
    status: TaskStatus;
    compact?: boolean;
}) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-full border',
                compact ? 'size-4 border-0' : 'size-7',
                statusClasses[status],
            )}
            title={statusLabels[status]}
        >
            {status === 'done' && (
                <CheckCircle2
                    aria-hidden="true"
                    className={cn(compact ? 'size-3' : 'size-4')}
                />
            )}
            {status === 'in_progress' && (
                <Clock3
                    aria-hidden="true"
                    className={cn(compact ? 'size-3' : 'size-4')}
                />
            )}
            {status === 'blocked' && (
                <CircleAlert
                    aria-hidden="true"
                    className={cn(compact ? 'size-3' : 'size-4')}
                />
            )}
            {status === 'todo' && (
                <CircleDot
                    aria-hidden="true"
                    className={cn(compact ? 'size-3' : 'size-4')}
                />
            )}
        </span>
    );
}

function StatusBadge({ status }: { status: TaskStatus }) {
    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold',
                statusClasses[status],
            )}
        >
            <StatusMark status={status} compact />
            {statusLabels[status]}
        </span>
    );
}

function TaskRow({
    task,
    selected,
    onSelect,
}: {
    task: WorkspaceTask;
    selected: boolean;
    onSelect: (task: WorkspaceTask) => void;
}) {
    return (
        <li className="min-w-0 border-b border-border last:border-b-0">
            <button
                type="button"
                className={cn(
                    'grid w-full cursor-pointer gap-3 px-4 py-4 text-left transition-[background-color,box-shadow] duration-fast ease-ledger hover:bg-muted/60 focus-visible:bg-muted/60',
                    selected &&
                        'bg-primary/5 ring-1 ring-primary/40 ring-inset',
                )}
                aria-pressed={selected}
                data-test={`task-row-${task.id}`}
                onClick={() => onSelect(task)}
            >
                <div className="flex min-w-0 items-start gap-3">
                    <StatusMark status={task.status} />
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-label text-label text-muted-foreground">
                                TASK {String(task.id).padStart(4, '0')}
                            </span>
                            <span
                                className={cn(
                                    'font-label text-label',
                                    priorityClasses[task.priority],
                                )}
                            >
                                {priorityLabels[task.priority]}
                            </span>
                        </div>
                        <h3 className="mt-1 text-sm leading-6 font-semibold break-words">
                            {task.title}
                        </h3>
                    </div>
                    <ChevronRight
                        aria-hidden="true"
                        className={cn(
                            'mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-fast',
                            selected && 'translate-x-0.5 text-primary',
                        )}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-10 text-xs text-muted-foreground">
                    <span
                        className={cn(
                            task.is_overdue &&
                                'font-semibold text-correction-subtle-foreground',
                        )}
                    >
                        <CalendarClock
                            aria-hidden="true"
                            className="mr-1 inline size-3.5"
                        />
                        {task.is_overdue
                            ? `Lewat ${formatDateTime(task.due_at)}`
                            : formatDateTime(task.due_at)}
                    </span>
                    <span>
                        <UserRound
                            aria-hidden="true"
                            className="mr-1 inline size-3.5"
                        />
                        {task.assignments.length > 0
                            ? `${task.assignments.length} penanggung jawab`
                            : 'Belum ditugaskan'}
                    </span>
                </div>
            </button>
        </li>
    );
}

function WorkspaceContextRail({
    project,
    tasks,
}: {
    project: WorkspaceProject;
    tasks: TaskPage;
}) {
    return (
        <div className="grid gap-6">
            <section className="grid gap-3 border-b border-border pb-5">
                <p className="font-label text-label text-muted-foreground">
                    KONTEKS PROJECT
                </p>
                <h2 className="text-lg font-semibold break-words">
                    {project.title}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Workspace adalah catatan kerja bersama. Refresh mengambil
                    snapshot terbaru dari database.
                </p>
            </section>

            <dl className="grid gap-4 text-sm">
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        PEMILIK
                    </dt>
                    <dd className="font-semibold break-words">
                        {project.owner.name}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        DEADLINE PROJECT
                    </dt>
                    <dd className="font-semibold">
                        {formatDateTime(project.deadline)}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        TASK DALAM DAFTAR
                    </dt>
                    <dd className="font-semibold">{tasks.meta.total} task</dd>
                </div>
            </dl>

            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                Hanya anggota aktif project yang dapat melihat dan mengubah
                task. Data private, diskusi, dan evidence tidak dirender pada
                surface ini.
            </p>
        </div>
    );
}

function TaskFormFields({
    data,
    errors,
    processing,
    onChange,
    idPrefix,
}: {
    data: CreateTaskData;
    errors: ErrorMap;
    processing: boolean;
    onChange: (field: keyof CreateTaskData, value: string) => void;
    idPrefix: string;
}) {
    const titleError = firstError(errors, 'title');
    const descriptionError = firstError(errors, 'description');
    const priorityError = firstError(errors, 'priority');
    const dueAtError = firstError(errors, 'due_at');

    return (
        <div className="grid gap-5">
            <div className="grid gap-2">
                <label
                    htmlFor={`${idPrefix}-title`}
                    className="text-sm font-semibold"
                >
                    Judul task
                </label>
                <Input
                    id={`${idPrefix}-title`}
                    data-test={`${idPrefix}-title`}
                    value={data.title}
                    onChange={(event) => onChange('title', event.target.value)}
                    maxLength={160}
                    disabled={processing}
                    aria-invalid={Boolean(titleError)}
                    placeholder="Contoh: Susun alur onboarding"
                />
                <InputError message={titleError} />
            </div>

            <div className="grid gap-2">
                <label
                    htmlFor={`${idPrefix}-description`}
                    className="text-sm font-semibold"
                >
                    Catatan kerja
                </label>
                <textarea
                    id={`${idPrefix}-description`}
                    data-test={`${idPrefix}-description`}
                    className={textAreaClassName}
                    value={data.description}
                    onChange={(event) =>
                        onChange('description', event.target.value)
                    }
                    maxLength={5000}
                    disabled={processing}
                    aria-invalid={Boolean(descriptionError)}
                    placeholder="Konteks singkat, hasil yang diharapkan, atau catatan handoff"
                />
                <InputError message={descriptionError} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                    <label
                        htmlFor={`${idPrefix}-priority`}
                        className="text-sm font-semibold"
                    >
                        Prioritas
                    </label>
                    <select
                        id={`${idPrefix}-priority`}
                        data-test={`${idPrefix}-priority`}
                        className={selectClassName}
                        value={data.priority}
                        onChange={(event) =>
                            onChange(
                                'priority',
                                event.target.value as TaskPriority,
                            )
                        }
                        disabled={processing}
                        aria-invalid={Boolean(priorityError)}
                    >
                        {priorityOptions.map((priority) => (
                            <option key={priority} value={priority}>
                                {priorityLabels[priority]}
                            </option>
                        ))}
                    </select>
                    <InputError message={priorityError} />
                </div>

                <div className="grid gap-2">
                    <label
                        htmlFor={`${idPrefix}-due-at`}
                        className="text-sm font-semibold"
                    >
                        Due date
                    </label>
                    <Input
                        id={`${idPrefix}-due-at`}
                        data-test={`${idPrefix}-due-at`}
                        type="datetime-local"
                        value={data.due_at}
                        onChange={(event) =>
                            onChange('due_at', event.target.value)
                        }
                        disabled={processing}
                        aria-invalid={Boolean(dueAtError)}
                    />
                    <InputError message={dueAtError} />
                </div>
            </div>
        </div>
    );
}

function TaskLoadingState() {
    return (
        <div
            data-test="workspace-refresh-skeleton"
            role="region"
            aria-busy="true"
            aria-label="Daftar task sedang dimuat"
            className="grid gap-3 border-y border-border py-4"
        >
            <div aria-hidden="true" className="grid gap-3">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
}

function WorkspaceEmptyState({
    filtered,
    onCreate,
    onResetFilters,
}: {
    filtered: boolean;
    onCreate: () => void;
    onResetFilters: () => void;
}) {
    return (
        <div
            data-test="workspace-empty-state"
            className="grid gap-4 border-y border-border px-4 py-10 text-center sm:px-8"
        >
            <ClipboardList
                aria-hidden="true"
                className="mx-auto size-8 text-primary"
            />
            <div className="grid gap-2">
                <h3 className="text-lg font-semibold">
                    {filtered
                        ? 'Tidak ada task yang cocok dengan filter'
                        : 'Belum ada task di workspace'}
                </h3>
                <p className="mx-auto max-w-[52ch] text-sm leading-6 text-muted-foreground">
                    {filtered
                        ? 'Coba ubah kata kunci atau bersihkan filter untuk melihat seluruh ledger kerja project.'
                        : 'Mulai dari satu pekerjaan yang jelas. Tim dapat memperbarui status, penanggung jawab, prioritas, dan due date tanpa bergantung pada koneksi realtime.'}
                </p>
            </div>
            {filtered ? (
                <Button
                    type="button"
                    variant="outline"
                    className="mx-auto w-fit cursor-pointer"
                    onClick={onResetFilters}
                    data-test="workspace-empty-reset"
                >
                    Bersihkan filter
                </Button>
            ) : (
                <Button
                    type="button"
                    className="mx-auto w-fit cursor-pointer"
                    onClick={onCreate}
                    data-test="workspace-empty-create"
                >
                    <Plus aria-hidden="true" />
                    Buat task pertama
                </Button>
            )}
        </div>
    );
}

export default function ProjectWorkspace({
    project,
    tasks,
    discussion,
    members,
    filters,
    permissions,
}: WorkspaceProps) {
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
        tasks.data[0]?.id ?? null,
    );
    const [editorMode, setEditorMode] = useState<'create' | 'edit'>(
        tasks.data.length === 0 ? 'create' : 'edit',
    );
    const [filterDraft, setFilterDraft] = useState(filters);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionRecovery, setActionRecovery] =
        useState<WorkspaceRecoveryAction | null>(null);
    const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<WorkspaceTask | null>(
        null,
    );
    const reconciliationQueue = useRef<Set<RealtimeReconciliationScope>>(
        new Set(),
    );
    const reconciliationReasons = useRef<Set<ReconciliationReason>>(new Set());
    const reconciliationInFlight = useRef(false);
    const reconciliationSuccessNotice = useRef<string | null>(null);
    const retryAction = useRef<(() => void) | null>(null);
    const isWorkspaceMounted = useRef(true);

    const createForm = useHttp<CreateTaskData, TaskResponse>({
        title: '',
        description: '',
        priority: 'medium',
        due_at: '',
    });
    const editForm = useHttp<UpdateTaskData, TaskResponse>({
        title: '',
        description: '',
        priority: 'medium',
        due_at: '',
        expected_updated_at: '',
    });
    const transitionForm = useHttp<TransitionTaskData, TaskResponse>({
        status: 'todo',
        expected_updated_at: '',
    });
    const assignForm = useHttp<AssignmentData, AssignmentResponse>({
        assignee_id: '',
    });
    const unassignForm = useHttp<AssignmentData, AssignmentResponse>({
        assignee_id: '',
    });
    const deleteForm = useHttp<DeleteTaskData, DeleteResponse>({});

    const selectedTask = useMemo(
        () =>
            tasks.data.find((task) => task.id === selectedTaskId) ??
            tasks.data[0] ??
            null,
        [selectedTaskId, tasks.data],
    );
    const createErrors = createForm.errors as ErrorMap;
    const editErrors = editForm.errors as ErrorMap;
    const transitionErrors = transitionForm.errors as ErrorMap;
    const assignErrors = assignForm.errors as ErrorMap;

    function reconciliationProps(
        scopes: Set<RealtimeReconciliationScope>,
    ): string[] {
        if (scopes.has('workspace')) {
            return [
                'project',
                'tasks',
                'discussion',
                'members',
                'filters',
                'permissions',
            ];
        }

        const props = new Set<string>();

        if (scopes.has('tasks')) {
            props.add('tasks');
            props.add('members');
        }

        if (scopes.has('discussion')) {
            props.add('discussion');
        }

        return Array.from(props);
    }

    function reconciliationStartMessage(
        scopes: Set<RealtimeReconciliationScope>,
        reasons: Set<ReconciliationReason>,
    ): string {
        if (reasons.has('reconnect')) {
            return 'Koneksi kembali. Menyinkronkan snapshot workspace dari database...';
        }

        if (reasons.has('stale')) {
            return 'Data berubah di sesi lain. Memuat versi terbaru dari database...';
        }

        if (reasons.has('manual')) {
            return 'Memuat snapshot workspace terbaru dari database...';
        }

        return scopes.has('discussion') && !scopes.has('tasks')
            ? 'Perubahan diskusi diterima. Menyinkronkan snapshot terbaru dari database...'
            : 'Perubahan task diterima. Menyinkronkan snapshot terbaru dari database...';
    }

    function reconciliationSuccessMessage(
        scopes: Set<RealtimeReconciliationScope>,
        reasons: Set<ReconciliationReason>,
    ): string {
        if (reasons.has('reconnect')) {
            return 'Koneksi kembali. Snapshot workspace terbaru sudah disinkronkan dari database.';
        }

        if (reasons.has('stale')) {
            return 'Data terbaru sudah dimuat dari database. Periksa kembali draft sebelum menyimpan.';
        }

        if (reasons.has('manual')) {
            return 'Snapshot workspace terbaru sudah dimuat dari database.';
        }

        return scopes.has('discussion') && !scopes.has('tasks')
            ? 'Snapshot diskusi terbaru sudah disinkronkan dari database.'
            : 'Snapshot task terbaru sudah disinkronkan dari database.';
    }

    function flushReconciliation(): void {
        if (
            !isWorkspaceMounted.current ||
            reconciliationInFlight.current ||
            reconciliationQueue.current.size === 0
        ) {
            return;
        }

        const scopes = new Set(reconciliationQueue.current);
        const reasons = new Set(reconciliationReasons.current);
        const successMessage = reconciliationSuccessNotice.current;

        reconciliationQueue.current.clear();
        reconciliationReasons.current.clear();
        reconciliationSuccessNotice.current = null;
        reconciliationInFlight.current = true;
        setRealtimeNotice(reconciliationStartMessage(scopes, reasons));

        router.reload({
            only: reconciliationProps(scopes),
            onSuccess: () => {
                if (!isWorkspaceMounted.current) {
                    return;
                }

                setRealtimeNotice(
                    reconciliationSuccessMessage(scopes, reasons),
                );

                if (
                    reasons.has('reconnect') ||
                    reasons.has('manual') ||
                    reasons.has('stale') ||
                    reasons.has('command')
                ) {
                    setActionError(null);
                    setActionRecovery(null);
                    retryAction.current = null;
                }

                if (successMessage !== null) {
                    setActionMessage(successMessage);
                }
            },
            onError: () => {
                if (!isWorkspaceMounted.current) {
                    return;
                }

                setActionError(
                    'Snapshot terbaru belum dapat dimuat. Data yang terlihat dipertahankan, silakan coba lagi.',
                );
                setActionRecovery('reload');
                retryAction.current = () =>
                    requestWorkspaceReconciliation('manual');
            },
            onFinish: () => {
                reconciliationInFlight.current = false;
                flushReconciliation();
            },
        });
    }

    function requestRealtimeReconciliation(
        scope: Exclude<RealtimeReconciliationScope, 'workspace'>,
        reason: ReconciliationReason = 'delta',
        successMessage: string | null = null,
    ): void {
        if (!reconciliationQueue.current.has('workspace')) {
            reconciliationQueue.current.add(scope);
        }

        reconciliationReasons.current.add(reason);

        if (successMessage !== null) {
            reconciliationSuccessNotice.current = successMessage;
        }

        flushReconciliation();
    }

    function requestWorkspaceReconciliation(
        reason: Exclude<ReconciliationReason, 'delta' | 'command'>,
    ): void {
        reconciliationQueue.current.clear();
        reconciliationQueue.current.add('workspace');
        reconciliationReasons.current.add(reason);
        flushReconciliation();
    }

    const realtime = useWorkspaceRealtime({
        institutionId: project.institution_id,
        projectId: project.id,
        onTaskDelta: () => requestRealtimeReconciliation('tasks'),
        onDiscussionDelta: () => requestRealtimeReconciliation('discussion'),
        onReconnect: () => requestWorkspaceReconciliation('reconnect'),
    });

    useEffect(() => {
        const queue = reconciliationQueue.current;
        const reasons = reconciliationReasons.current;
        isWorkspaceMounted.current = true;

        return () => {
            isWorkspaceMounted.current = false;
            queue.clear();
            reasons.clear();
            reconciliationSuccessNotice.current = null;
        };
    }, []);

    useEffect(() => {
        const removeStartListener = router.on('start', () =>
            setIsRefreshing(true),
        );
        const removeFinishListener = router.on('finish', () =>
            setIsRefreshing(false),
        );

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    useEffect(() => {
        if (editorMode !== 'edit' || selectedTask === null) {
            return;
        }

        editForm.setData({
            title: selectedTask.title,
            description: selectedTask.description ?? '',
            priority: selectedTask.priority,
            due_at: dateTimeLocalValue(selectedTask.due_at),
            expected_updated_at: selectedTask.updated_at,
        });
        // useHttp owns the editor state, so it needs a sync point after a refresh.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editorMode, selectedTask?.id, selectedTask?.updated_at]);

    function selectTask(task: WorkspaceTask) {
        setSelectedTaskId(task.id);
        setEditorMode('edit');
        clearActionFeedback();
        editForm.clearErrors();
        editForm.setData({
            title: task.title,
            description: task.description ?? '',
            priority: task.priority,
            due_at: dateTimeLocalValue(task.due_at),
            expected_updated_at: task.updated_at,
        });
    }

    function startCreate() {
        setSelectedTaskId(null);
        setEditorMode('create');
        clearActionFeedback();
        createForm.clearErrors();
        createForm.setData({
            title: '',
            description: '',
            priority: 'medium',
            due_at: '',
        });
    }

    function clearActionFeedback(): void {
        setActionMessage(null);
        setActionError(null);
        setActionRecovery(null);
        retryAction.current = null;
    }

    function commandOptions(fallback: string, retry: () => void) {
        return {
            onHttpException: (response: { status: number }) => {
                setActionError(requestFailureMessage(response.status));
                setActionRecovery(response.status === 409 ? 'stale' : 'reload');
                retryAction.current = retry;

                return false;
            },
            onNetworkError: () => {
                setActionError(`${fallback} Periksa koneksi lalu coba lagi.`);
                setActionRecovery('retry');
                retryAction.current = retry;

                return false;
            },
        };
    }

    function reloadWorkspace(successMessage: string): void {
        requestRealtimeReconciliation('tasks', 'command', successMessage);
    }

    function runCreate(): void {
        if (createForm.processing) {
            return;
        }

        clearActionFeedback();
        createForm
            .post(ProjectWorkspaceController.store(project.id).url, {
                ...commandOptions('Task belum tersimpan.', runCreate),
            })
            .then((response) => {
                setSelectedTaskId(response.data.id);
                setEditorMode('edit');
                reloadWorkspace('Task baru berhasil ditambahkan ke workspace.');
            })
            .catch(() => undefined);
    }

    function submitCreate(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        runCreate();
    }

    function runEdit(): void {
        if (selectedTask === null || editForm.processing) {
            return;
        }

        clearActionFeedback();
        editForm.transform((data) => ({
            ...data,
            expected_updated_at: selectedTask.updated_at,
        }));
        editForm
            .patch(
                ProjectWorkspaceController.update({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions(
                        'Perubahan task belum tersimpan.',
                        runEdit,
                    ),
                },
            )
            .then(() => {
                reloadWorkspace('Detail task berhasil diperbarui.');
            })
            .catch(() => undefined);
    }

    function submitEdit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        runEdit();
    }

    function runTransition(status: TaskStatus): void {
        if (selectedTask === null || transitionForm.processing) {
            return;
        }

        clearActionFeedback();
        transitionForm.transform((data) => ({
            ...data,
            status,
            expected_updated_at: selectedTask.updated_at,
        }));
        transitionForm
            .post(
                ProjectWorkspaceController.transition({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions('Status task belum berubah.', () =>
                        runTransition(status),
                    ),
                },
            )
            .then(() => {
                reloadWorkspace(`Status task menjadi ${statusLabels[status]}.`);
            })
            .catch(() => undefined);
    }

    function transitionTask(status: TaskStatus): void {
        runTransition(status);
    }

    function runAssignTask(): void {
        if (
            selectedTask === null ||
            assignForm.processing ||
            assignForm.data.assignee_id === ''
        ) {
            return;
        }

        clearActionFeedback();
        assignForm
            .post(
                ProjectWorkspaceController.assign({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions(
                        'Penanggung jawab belum ditambahkan.',
                        runAssignTask,
                    ),
                },
            )
            .then(() => {
                assignForm.setData('assignee_id', '');
                reloadWorkspace('Penanggung jawab task berhasil diperbarui.');
            })
            .catch(() => undefined);
    }

    function assignTask(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        runAssignTask();
    }

    function runUnassignTask(userId: number): void {
        if (selectedTask === null || unassignForm.processing) {
            return;
        }

        clearActionFeedback();
        unassignForm.transform((data) => ({
            ...data,
            assignee_id: userId,
        }));
        unassignForm
            .delete(
                ProjectWorkspaceController.unassign({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions('Penanggung jawab belum dilepas.', () =>
                        runUnassignTask(userId),
                    ),
                },
            )
            .then(() => {
                unassignForm.setData('assignee_id', '');
                reloadWorkspace('Penanggung jawab task berhasil dilepas.');
            })
            .catch(() => undefined);
    }

    function unassignTask(userId: number): void {
        runUnassignTask(userId);
    }

    function runDeleteTask(): void {
        if (pendingDelete === null || deleteForm.processing) {
            return;
        }

        const task = pendingDelete;
        clearActionFeedback();
        deleteForm
            .delete(
                ProjectWorkspaceController.destroy({
                    project: project.id,
                    task: task.id,
                }).url,
                {
                    ...commandOptions(
                        'Task belum dapat dihapus.',
                        runDeleteTask,
                    ),
                },
            )
            .then(() => {
                setPendingDelete(null);
                setSelectedTaskId(null);
                setEditorMode('create');
                reloadWorkspace('Task berhasil dihapus dari workspace.');
            })
            .catch(() => undefined);
    }

    function deleteTask(): void {
        runDeleteTask();
    }

    function applyFilters(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearActionFeedback();
        router.visit(
            ProjectWorkspaceController.show(project.id, {
                query: {
                    q: filterDraft.q || null,
                    status: filterDraft.status,
                    priority: filterDraft.priority,
                    per_page: filterDraft.per_page,
                },
            }).url,
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    }

    function changePage(page: number) {
        router.visit(
            ProjectWorkspaceController.show(project.id, {
                query: {
                    q: filters.q || null,
                    status: filters.status,
                    priority: filters.priority,
                    per_page: filters.per_page,
                    page,
                },
            }).url,
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    }

    function resetFilters() {
        clearActionFeedback();
        setFilterDraft((current) => ({
            ...current,
            q: '',
            status: null,
            priority: null,
            page: 1,
        }));
        router.visit(
            ProjectWorkspaceController.show(project.id, {
                query: { per_page: filters.per_page },
            }).url,
            {
                preserveScroll: true,
                preserveState: false,
            },
        );
    }

    function recoverAction(): void {
        const recovery = actionRecovery;
        const retry = retryAction.current;

        setActionError(null);
        setActionRecovery(null);
        retryAction.current = null;

        if (recovery === 'retry') {
            retry?.();

            return;
        }

        requestWorkspaceReconciliation(
            recovery === 'stale' ? 'stale' : 'manual',
        );
    }

    const canManage = permissions.can_manage_tasks;
    const detailErrors = editErrors;
    const selectedTransitionErrors = transitionErrors;
    const activeSelectedTaskId = selectedTask?.id ?? null;
    const hasActiveFilter = Boolean(
        filters.q || filters.status !== null || filters.priority !== null,
    );

    return (
        <>
            <Head title={`Workspace · ${project.title}`} />
            <AppPage
                contextRail={
                    <WorkspaceContextRail project={project} tasks={tasks} />
                }
                contextRailLabel="Konteks workspace project"
            >
                <div
                    data-test="workspace-root"
                    aria-busy={isRefreshing}
                    className="mx-auto grid max-w-6xl min-w-0 gap-7"
                >
                    <header className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-8">
                        <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className="font-label text-label text-muted-foreground">
                                    WORKSPACE PROJECT{' '}
                                    {String(project.id).padStart(4, '0')}
                                </span>
                                <span className="border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">
                                    Sumber data: database
                                </span>
                                <WorkspaceRealtimeStatus
                                    status={realtime.connectionState}
                                    presenceMembers={realtime.presenceMembers}
                                    onRetry={realtime.retryConnection}
                                />
                            </div>
                            <h1 className="max-w-[28ch] text-headline font-bold text-balance break-words">
                                {project.title}
                            </h1>
                            <p className="max-w-[70ch] text-body leading-7 text-muted-foreground">
                                Satu ledger kerja untuk menyusun, menugaskan,
                                dan menyelesaikan task bersama tim.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            <Button
                                asChild
                                variant="ghost"
                                className="cursor-pointer"
                            >
                                <Link href={projectShow(project.id)}>
                                    Kembali ke detail project
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                disabled={isRefreshing}
                                onClick={() => {
                                    clearActionFeedback();
                                    requestWorkspaceReconciliation('manual');
                                }}
                                data-test="workspace-refresh"
                            >
                                <RefreshCw
                                    aria-hidden="true"
                                    className={cn(
                                        isRefreshing && 'animate-spin',
                                    )}
                                />
                                Muat ulang
                            </Button>
                            {canManage && (
                                <Button
                                    type="button"
                                    className="cursor-pointer"
                                    onClick={startCreate}
                                    data-test="workspace-new-task"
                                >
                                    <Plus aria-hidden="true" />
                                    Task baru
                                </Button>
                            )}
                        </div>
                    </header>

                    <div
                        role="status"
                        aria-live="polite"
                        data-test="workspace-refresh-status"
                        className="min-h-5 text-sm text-muted-foreground"
                    >
                        {isRefreshing && (
                            <span className="inline-flex items-center gap-2">
                                <Spinner aria-hidden="true" />
                                Memuat snapshot workspace terbaru...
                            </span>
                        )}
                    </div>

                    {realtimeNotice && (
                        <p
                            role="status"
                            aria-live="polite"
                            data-test="workspace-realtime-update"
                            className="border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary"
                        >
                            {realtimeNotice}
                        </p>
                    )}

                    {actionMessage && (
                        <p
                            role="status"
                            aria-live="polite"
                            data-test="workspace-action-success"
                            className="flex items-start gap-2 border border-verified/40 bg-verified-subtle px-4 py-3 text-sm text-verified-subtle-foreground"
                        >
                            <CheckCircle2
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            {actionMessage}
                        </p>
                    )}

                    {actionError && (
                        <div
                            role="alert"
                            data-test="workspace-action-error"
                            className="flex items-start justify-between gap-3 border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                        >
                            <span className="flex items-start gap-2">
                                <AlertCircle
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0"
                                />
                                {actionError}
                            </span>
                            <span className="flex shrink-0 items-center gap-1">
                                <button
                                    type="button"
                                    className="cursor-pointer px-2 py-1 text-xs font-semibold underline underline-offset-2 hover:no-underline"
                                    onClick={recoverAction}
                                    data-test="workspace-action-recovery"
                                >
                                    {actionRecovery === 'retry'
                                        ? 'Coba lagi'
                                        : actionRecovery === 'stale'
                                          ? 'Muat data terbaru'
                                          : 'Muat ulang'}
                                </button>
                                <button
                                    type="button"
                                    className="cursor-pointer p-1 text-current hover:opacity-70"
                                    aria-label="Tutup pesan error"
                                    onClick={() => {
                                        setActionError(null);
                                        setActionRecovery(null);
                                        retryAction.current = null;
                                    }}
                                >
                                    <X aria-hidden="true" className="size-4" />
                                </button>
                            </span>
                        </div>
                    )}

                    {!canManage && (
                        <div
                            data-test="workspace-read-only"
                            className="flex items-start gap-2 border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
                        >
                            <LockKeyhole
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            <p>
                                Mode baca. Permission perubahan task tidak
                                tersedia untuk akun ini.
                            </p>
                        </div>
                    )}

                    <section
                        aria-labelledby="workspace-filters-title"
                        className="grid gap-4 border-y border-border py-5"
                    >
                        <div className="flex items-start gap-3">
                            <Filter
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-primary"
                            />
                            <div className="grid gap-1">
                                <h2
                                    id="workspace-filters-title"
                                    className="font-label text-label text-muted-foreground"
                                >
                                    FILTER TASK
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Gunakan filter untuk menemukan pekerjaan
                                    tanpa mengubah urutan ledger.
                                </p>
                            </div>
                        </div>
                        <form
                            className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(10rem,0.7fr)_minmax(10rem,0.7fr)_auto] md:items-end"
                            onSubmit={applyFilters}
                            data-test="workspace-filters"
                        >
                            <div className="grid min-w-0 gap-2">
                                <label
                                    htmlFor="workspace-search"
                                    className="text-sm font-semibold"
                                >
                                    Cari task
                                </label>
                                <Input
                                    id="workspace-search"
                                    value={filterDraft.q}
                                    onChange={(event) =>
                                        setFilterDraft((current) => ({
                                            ...current,
                                            q: event.target.value,
                                            page: 1,
                                        }))
                                    }
                                    placeholder="Judul atau catatan kerja"
                                />
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <label
                                    htmlFor="workspace-status-filter"
                                    className="text-sm font-semibold"
                                >
                                    Status
                                </label>
                                <select
                                    id="workspace-status-filter"
                                    className={selectClassName}
                                    value={filterDraft.status ?? ''}
                                    onChange={(event) =>
                                        setFilterDraft((current) => ({
                                            ...current,
                                            status:
                                                (event.target
                                                    .value as TaskStatus) ||
                                                null,
                                            page: 1,
                                        }))
                                    }
                                >
                                    <option value="">Semua status</option>
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>
                                            {statusLabels[status]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <label
                                    htmlFor="workspace-priority-filter"
                                    className="text-sm font-semibold"
                                >
                                    Prioritas
                                </label>
                                <select
                                    id="workspace-priority-filter"
                                    className={selectClassName}
                                    value={filterDraft.priority ?? ''}
                                    onChange={(event) =>
                                        setFilterDraft((current) => ({
                                            ...current,
                                            priority:
                                                (event.target
                                                    .value as TaskPriority) ||
                                                null,
                                            page: 1,
                                        }))
                                    }
                                >
                                    <option value="">Semua prioritas</option>
                                    {priorityOptions.map((priority) => (
                                        <option key={priority} value={priority}>
                                            {priorityLabels[priority]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                className="cursor-pointer"
                                disabled={isRefreshing}
                            >
                                Terapkan filter
                            </Button>
                        </form>
                    </section>

                    {isRefreshing && <TaskLoadingState />}

                    <main
                        aria-labelledby="workspace-tasks-title"
                        className="grid min-w-0 gap-5"
                    >
                        <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0 space-y-1">
                                <h2
                                    id="workspace-tasks-title"
                                    className="text-title font-semibold"
                                >
                                    Daftar task
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {tasks.meta.total === 0
                                        ? 'Belum ada hasil pada filter ini.'
                                        : `${tasks.meta.total} task dalam konteks workspace ini.`}
                                </p>
                            </div>
                            <span className="font-label text-label text-muted-foreground">
                                Halaman {tasks.meta.current_page} dari{' '}
                                {tasks.meta.last_page}
                            </span>
                        </div>

                        {tasks.meta.total === 0 ? (
                            <div className="grid min-w-0 gap-6">
                                <WorkspaceEmptyState
                                    filtered={hasActiveFilter}
                                    onCreate={startCreate}
                                    onResetFilters={resetFilters}
                                />
                                {canManage &&
                                    !hasActiveFilter &&
                                    editorMode === 'create' && (
                                        <form
                                            className="grid gap-6 border border-border bg-background p-4 sm:p-6"
                                            onSubmit={submitCreate}
                                            data-test="task-create-form"
                                        >
                                            <div className="grid gap-1">
                                                <p className="font-label text-label text-muted-foreground">
                                                    TASK BARU
                                                </p>
                                                <h3 className="text-lg font-semibold">
                                                    Susun pekerjaan yang dapat
                                                    ditindaklanjuti
                                                </h3>
                                            </div>
                                            <TaskFormFields
                                                data={createForm.data}
                                                errors={createErrors}
                                                processing={
                                                    createForm.processing
                                                }
                                                onChange={(field, value) =>
                                                    createForm.setData(
                                                        field,
                                                        field === 'priority'
                                                            ? (value as TaskPriority)
                                                            : value,
                                                    )
                                                }
                                                idPrefix="task-create"
                                            />
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                                                <p className="text-xs leading-5 text-muted-foreground">
                                                    Due date tidak boleh
                                                    melewati deadline project.
                                                </p>
                                                <Button
                                                    type="submit"
                                                    className="cursor-pointer"
                                                    disabled={
                                                        createForm.processing
                                                    }
                                                    data-test="task-create-submit"
                                                >
                                                    {createForm.processing && (
                                                        <Spinner aria-hidden="true" />
                                                    )}
                                                    <Plus aria-hidden="true" />
                                                    Tambahkan task
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                            </div>
                        ) : (
                            <div
                                data-test="workspace-panels"
                                className="grid min-w-0 gap-6 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.4fr)] lg:items-start"
                            >
                                <section
                                    aria-labelledby="workspace-list-title"
                                    className="min-w-0 border border-border bg-card/20"
                                >
                                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                                        <h3
                                            id="workspace-list-title"
                                            className="font-label text-label text-muted-foreground"
                                        >
                                            TASK LEDGER
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {tasks.meta.from}-{tasks.meta.to}
                                        </span>
                                    </div>
                                    <ul
                                        data-test="workspace-task-list"
                                        className="min-w-0"
                                    >
                                        {tasks.data.map((task) => (
                                            <TaskRow
                                                key={task.id}
                                                task={task}
                                                selected={
                                                    activeSelectedTaskId ===
                                                    task.id
                                                }
                                                onSelect={selectTask}
                                            />
                                        ))}
                                    </ul>
                                </section>

                                <section
                                    aria-labelledby="workspace-detail-title"
                                    data-test="workspace-task-detail"
                                    className="min-w-0 border border-border bg-background"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
                                        <div className="min-w-0">
                                            <p className="font-label text-label text-muted-foreground">
                                                {editorMode === 'create'
                                                    ? 'TASK BARU'
                                                    : selectedTask
                                                      ? `TASK ${String(selectedTask.id).padStart(4, '0')}`
                                                      : 'DETAIL TASK'}
                                            </p>
                                            <h3
                                                id="workspace-detail-title"
                                                className="mt-1 text-lg font-semibold break-words"
                                            >
                                                {editorMode === 'create'
                                                    ? 'Susun pekerjaan yang dapat ditindaklanjuti'
                                                    : (selectedTask?.title ??
                                                      'Pilih task dari ledger')}
                                            </h3>
                                        </div>
                                        {editorMode === 'edit' &&
                                            selectedTask && (
                                                <StatusBadge
                                                    status={selectedTask.status}
                                                />
                                            )}
                                    </div>

                                    {editorMode === 'create' ? (
                                        <form
                                            className="grid gap-6 p-4 sm:p-6"
                                            onSubmit={submitCreate}
                                            data-test="task-create-form"
                                        >
                                            <TaskFormFields
                                                data={createForm.data}
                                                errors={createErrors}
                                                processing={
                                                    createForm.processing
                                                }
                                                onChange={(field, value) =>
                                                    createForm.setData(
                                                        field,
                                                        field === 'priority'
                                                            ? (value as TaskPriority)
                                                            : value,
                                                    )
                                                }
                                                idPrefix="task-create"
                                            />
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                                                <p className="text-xs leading-5 text-muted-foreground">
                                                    Due date tidak boleh
                                                    melewati deadline project.
                                                </p>
                                                <Button
                                                    type="submit"
                                                    className="cursor-pointer"
                                                    disabled={
                                                        !canManage ||
                                                        createForm.processing
                                                    }
                                                    data-test="task-create-submit"
                                                >
                                                    {createForm.processing && (
                                                        <Spinner aria-hidden="true" />
                                                    )}
                                                    <Plus aria-hidden="true" />
                                                    Tambahkan task
                                                </Button>
                                            </div>
                                        </form>
                                    ) : selectedTask ? (
                                        <div className="grid gap-6 p-4 sm:p-6">
                                            <form
                                                className="grid gap-6"
                                                onSubmit={submitEdit}
                                                data-test="task-edit-form"
                                            >
                                                <TaskFormFields
                                                    data={editForm.data}
                                                    errors={detailErrors}
                                                    processing={
                                                        editForm.processing
                                                    }
                                                    onChange={(field, value) =>
                                                        editForm.setData(
                                                            field,
                                                            field === 'priority'
                                                                ? (value as TaskPriority)
                                                                : value,
                                                        )
                                                    }
                                                    idPrefix="task-edit"
                                                />
                                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                                                    <p className="text-xs leading-5 text-muted-foreground">
                                                        Terakhir diperbarui{' '}
                                                        {formatDateTime(
                                                            selectedTask.updated_at,
                                                        )}
                                                    </p>
                                                    <Button
                                                        type="submit"
                                                        className="cursor-pointer"
                                                        disabled={
                                                            !canManage ||
                                                            editForm.processing
                                                        }
                                                        data-test="task-edit-submit"
                                                    >
                                                        {editForm.processing && (
                                                            <Spinner aria-hidden="true" />
                                                        )}
                                                        <Save aria-hidden="true" />
                                                        Simpan perubahan
                                                    </Button>
                                                </div>
                                            </form>

                                            <section
                                                aria-labelledby="task-status-title"
                                                className="grid gap-3 border-t border-border pt-5"
                                            >
                                                <div className="grid gap-1">
                                                    <h4
                                                        id="task-status-title"
                                                        className="font-label text-label text-muted-foreground"
                                                    >
                                                        STATUS WORKFLOW
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Gunakan tombol ini
                                                        sebagai alternatif
                                                        keyboard untuk
                                                        perpindahan status.
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {statusOptions.map(
                                                        (status) => {
                                                            const isCurrent =
                                                                status ===
                                                                selectedTask.status;
                                                            const isAllowed =
                                                                isCurrent ||
                                                                transitions[
                                                                    selectedTask
                                                                        .status
                                                                ].includes(
                                                                    status,
                                                                );

                                                            return (
                                                                <Button
                                                                    key={status}
                                                                    type="button"
                                                                    size="sm"
                                                                    variant={
                                                                        isCurrent
                                                                            ? 'default'
                                                                            : 'outline'
                                                                    }
                                                                    className="cursor-pointer"
                                                                    disabled={
                                                                        !canManage ||
                                                                        isCurrent ||
                                                                        !isAllowed ||
                                                                        transitionForm.processing
                                                                    }
                                                                    aria-current={
                                                                        isCurrent
                                                                            ? 'step'
                                                                            : undefined
                                                                    }
                                                                    data-test={`task-status-${status}`}
                                                                    onClick={() =>
                                                                        transitionTask(
                                                                            status,
                                                                        )
                                                                    }
                                                                >
                                                                    {isCurrent && (
                                                                        <Check aria-hidden="true" />
                                                                    )}
                                                                    {
                                                                        statusLabels[
                                                                            status
                                                                        ]
                                                                    }
                                                                </Button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                                <InputError
                                                    message={firstError(
                                                        selectedTransitionErrors,
                                                        'status',
                                                    )}
                                                />
                                            </section>

                                            <section
                                                aria-labelledby="task-assignees-title"
                                                className="grid gap-4 border-t border-border pt-5"
                                            >
                                                <div className="grid gap-1">
                                                    <h4
                                                        id="task-assignees-title"
                                                        className="font-label text-label text-muted-foreground"
                                                    >
                                                        PENANGGUNG JAWAB
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Pilih anggota aktif team
                                                        untuk memperjelas
                                                        handoff.
                                                    </p>
                                                </div>
                                                {selectedTask.assignments
                                                    .length > 0 && (
                                                    <ul className="grid gap-2">
                                                        {selectedTask.assignments.map(
                                                            (assignment) => (
                                                                <li
                                                                    key={
                                                                        assignment.id
                                                                    }
                                                                    className="flex min-w-0 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
                                                                >
                                                                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                                                                        <UserRound
                                                                            aria-hidden="true"
                                                                            className="size-4 shrink-0 text-primary"
                                                                        />
                                                                        <span className="truncate">
                                                                            {
                                                                                assignment
                                                                                    .user
                                                                                    .name
                                                                            }
                                                                        </span>
                                                                    </span>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="cursor-pointer text-muted-foreground hover:text-correction-subtle-foreground"
                                                                        disabled={
                                                                            !canManage ||
                                                                            unassignForm.processing
                                                                        }
                                                                        onClick={() =>
                                                                            unassignTask(
                                                                                assignment
                                                                                    .user
                                                                                    .id,
                                                                            )
                                                                        }
                                                                        aria-label={`Lepas ${assignment.user.name} dari task`}
                                                                        data-test={`task-unassign-${assignment.user.id}`}
                                                                    >
                                                                        <X aria-hidden="true" />
                                                                        Lepas
                                                                    </Button>
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                )}
                                                <form
                                                    className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                                                    onSubmit={assignTask}
                                                >
                                                    <div className="grid gap-2">
                                                        <label
                                                            htmlFor="task-assignee"
                                                            className="text-sm font-semibold"
                                                        >
                                                            Tambah anggota
                                                        </label>
                                                        <select
                                                            id="task-assignee"
                                                            className={
                                                                selectClassName
                                                            }
                                                            value={
                                                                assignForm.data
                                                                    .assignee_id
                                                            }
                                                            onChange={(event) =>
                                                                assignForm.setData(
                                                                    'assignee_id',
                                                                    event.target
                                                                        .value
                                                                        ? Number(
                                                                              event
                                                                                  .target
                                                                                  .value,
                                                                          )
                                                                        : '',
                                                                )
                                                            }
                                                            disabled={
                                                                !canManage ||
                                                                assignForm.processing
                                                            }
                                                            aria-invalid={Boolean(
                                                                firstError(
                                                                    assignErrors,
                                                                    'assignee_id',
                                                                ),
                                                            )}
                                                        >
                                                            <option value="">
                                                                Pilih anggota
                                                                aktif
                                                            </option>
                                                            {members
                                                                .filter(
                                                                    (member) =>
                                                                        !selectedTask.assignments.some(
                                                                            (
                                                                                assignment,
                                                                            ) =>
                                                                                assignment
                                                                                    .user
                                                                                    .id ===
                                                                                member.id,
                                                                        ),
                                                                )
                                                                .map(
                                                                    (
                                                                        member,
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                member.id
                                                                            }
                                                                            value={
                                                                                member.id
                                                                            }
                                                                        >
                                                                            {
                                                                                member.name
                                                                            }{' '}
                                                                            (
                                                                            {
                                                                                member.role
                                                                            }
                                                                            )
                                                                        </option>
                                                                    ),
                                                                )}
                                                        </select>
                                                        <InputError
                                                            message={firstError(
                                                                assignErrors,
                                                                'assignee_id',
                                                            )}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="submit"
                                                        variant="outline"
                                                        className="cursor-pointer"
                                                        disabled={
                                                            !canManage ||
                                                            assignForm.processing ||
                                                            assignForm.data
                                                                .assignee_id ===
                                                                ''
                                                        }
                                                    >
                                                        {assignForm.processing && (
                                                            <Spinner aria-hidden="true" />
                                                        )}
                                                        Tugaskan
                                                    </Button>
                                                </form>
                                            </section>

                                            <section className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                                                <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                                                    <CircleAlert
                                                        aria-hidden="true"
                                                        className="mt-0.5 size-4 shrink-0"
                                                    />
                                                    Penghapusan task tidak dapat
                                                    dibatalkan dari halaman ini.
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    className="cursor-pointer"
                                                    disabled={
                                                        !canManage ||
                                                        deleteForm.processing
                                                    }
                                                    onClick={() =>
                                                        setPendingDelete(
                                                            selectedTask,
                                                        )
                                                    }
                                                    data-test="task-delete"
                                                >
                                                    <Trash2 aria-hidden="true" />
                                                    Hapus task
                                                </Button>
                                            </section>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3 p-6 text-sm text-muted-foreground">
                                            <p>
                                                Pilih task untuk melihat
                                                detailnya.
                                            </p>
                                            {canManage && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-fit cursor-pointer"
                                                    onClick={startCreate}
                                                >
                                                    <Plus aria-hidden="true" />
                                                    Buat task baru
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}

                        {tasks.meta.last_page > 1 && (
                            <nav
                                aria-label="Navigasi halaman task"
                                className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <p className="text-sm text-muted-foreground">
                                    Halaman {tasks.meta.current_page} dari{' '}
                                    {tasks.meta.last_page}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="cursor-pointer"
                                        disabled={
                                            isRefreshing ||
                                            tasks.meta.current_page <= 1
                                        }
                                        onClick={() =>
                                            changePage(
                                                tasks.meta.current_page - 1,
                                            )
                                        }
                                    >
                                        <ChevronLeft aria-hidden="true" />
                                        Sebelumnya
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="cursor-pointer"
                                        disabled={
                                            isRefreshing ||
                                            tasks.meta.current_page >=
                                                tasks.meta.last_page
                                        }
                                        onClick={() =>
                                            changePage(
                                                tasks.meta.current_page + 1,
                                            )
                                        }
                                    >
                                        Berikutnya
                                        <ChevronRight aria-hidden="true" />
                                    </Button>
                                </div>
                            </nav>
                        )}
                    </main>
                    <WorkspaceDiscussion
                        projectId={project.id}
                        initialPage={discussion}
                    />
                </div>
            </AppPage>

            <Dialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleteForm.processing) {
                        setPendingDelete(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogTitle>Hapus task ini?</DialogTitle>
                    <DialogDescription>
                        Task “{pendingDelete?.title}” dan penanggung jawabnya
                        akan dihapus dari workspace. Riwayat audit tetap
                        dipertahankan.
                    </DialogDescription>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                disabled={deleteForm.processing}
                            >
                                Kembali
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            className="cursor-pointer"
                            disabled={deleteForm.processing}
                            data-test="task-delete-confirm"
                            onClick={deleteTask}
                        >
                            {deleteForm.processing && (
                                <Spinner aria-hidden="true" />
                            )}
                            Ya, hapus task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProjectWorkspace.layout = {
    breadcrumbs: [
        {
            title: 'Project discovery',
            href: projectsIndex(),
        },
        {
            title: 'Workspace project',
        },
    ],
};
