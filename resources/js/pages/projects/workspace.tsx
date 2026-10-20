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
import { WorkspaceEvidence } from '@/components/projects/workspace-evidence';
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
    WorkspaceEvidencePage,
} from '@/types';

type CreateTaskData = {
    title: string;
    description: string;
    priority: TaskPriority;
    due_at: string;
};

type UpdateTaskData = CreateTaskData & {
    expected_revision: string;
};

type TransitionTaskData = {
    status: TaskStatus;
    expected_revision: string;
};

type AssignmentData = {
    assignee_id: number | '';
    expected_revision: string;
};

type DeleteTaskData = { expected_revision: string };

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
    evidence: WorkspaceEvidencePage;
    members: WorkspaceMember[];
    filters: TaskWorkspaceFilters;
    permissions: TaskWorkspacePermissions;
};

type RealtimeReconciliationScope =
    'workspace' | 'tasks' | 'discussion' | 'evidence';

type ReconciliationReason =
    'delta' | 'reconnect' | 'manual' | 'stale' | 'command';

type WorkspaceRecoveryAction = 'reload' | 'stale';

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
    'h-control-md w-full cursor-pointer rounded-md border border-input bg-background px-3 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

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
    }).format(date);
}

function submittedDueAt(value: string): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? value : date.toISOString();
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
                    KONTEKS PROYEK
                </p>
                <h2 className="text-lg font-semibold break-words">
                    {project.title}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Ruang kerja adalah catatan kerja bersama. Muat ulang
                    mengambil snapshot terbaru dari database.
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
                        TENGGAT PROYEK
                    </dt>
                    <dd className="font-semibold">
                        {formatDateTime(project.deadline)}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        TUGAS DALAM DAFTAR
                    </dt>
                    <dd className="font-semibold">{tasks.meta.total} task</dd>
                </div>
            </dl>

            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                Pemilik dan anggota aktif berizin bekerja di sini. Bukti dan
                diskusi privat tidak otomatis dibagikan ke publik.
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
                    Judul tugas
                </label>
                <Input
                    id={`${idPrefix}-title`}
                    data-test={`${idPrefix}-title`}
                    value={data.title}
                    onChange={(event) => onChange('title', event.target.value)}
                    maxLength={160}
                    disabled={processing}
                    aria-invalid={Boolean(titleError)}
                    aria-describedby={`${idPrefix}-title-error`}
                    placeholder="Contoh: Susun alur onboarding"
                />
                <InputError
                    id={`${idPrefix}-title-error`}
                    message={titleError}
                />
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
                    aria-describedby={`${idPrefix}-description-help ${idPrefix}-description-error`}
                    placeholder="Konteks singkat, hasil yang diharapkan, atau catatan handoff"
                />
                <InputError
                    id={`${idPrefix}-description-error`}
                    message={descriptionError}
                />
                <p
                    id={`${idPrefix}-description-help`}
                    className="text-sm leading-6 text-muted-foreground"
                >
                    Jelaskan hasil, bagian pekerjaanmu dan koordinasi dengan
                    rekan. Bukti serta pengakuan individual tetap diajukan
                    melalui Kontribusi.
                </p>
                <details
                    className="rounded-2xl border border-primary/15 bg-accent/40 p-3"
                    data-test={`${idPrefix}-collaboration-guidance`}
                >
                    <summary className="min-h-11 cursor-pointer rounded-xl px-2 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                        Contoh pembagian pekerjaan
                    </summary>
                    <p className="px-2 text-sm leading-6 text-muted-foreground">
                        Satu anggota menyusun hasil, anggota lain memeriksanya
                        melalui tugas terpisah. Tentukan penanggung jawab
                        setelah tugas tersimpan. Contoh hanya mengisi catatan
                        yang kosong dan tidak membuat tugas lain otomatis.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 px-2 pb-1">
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 max-w-full bg-white whitespace-normal"
                            disabled={
                                processing || Boolean(data.description.trim())
                            }
                            onClick={() =>
                                onChange(
                                    'description',
                                    'Hasil yang diharapkan: rancangan satu halaman panduan.\nBagian saya: menyusun alur dan isi awal.\nKoordinasi dengan rekan: sepakati anggota yang memeriksa kejelasan melalui tugas pemeriksaan terpisah.\nBukti hasil: unggah rancangan dan jelaskan bagian individual pada Kontribusi.',
                                )
                            }
                            data-test={`${idPrefix}-example-create`}
                        >
                            Contoh penyusunan hasil
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 max-w-full bg-white whitespace-normal"
                            disabled={
                                processing || Boolean(data.description.trim())
                            }
                            onClick={() =>
                                onChange(
                                    'description',
                                    'Hasil yang diharapkan: catatan pemeriksaan panduan.\nBagian saya: memeriksa kejelasan informasi dan menuliskan usulan perbaikan.\nKoordinasi dengan rekan: baca hasil penyusun dan sepakati perbaikan yang diperlukan.\nBukti hasil: unggah catatan pemeriksaan dan jelaskan bagian individual pada Kontribusi.',
                                )
                            }
                            data-test={`${idPrefix}-example-review`}
                        >
                            Contoh pemeriksaan rekan
                        </Button>
                    </div>
                </details>
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
                        aria-describedby={`${idPrefix}-priority-error`}
                    >
                        {priorityOptions.map((priority) => (
                            <option key={priority} value={priority}>
                                {priorityLabels[priority]}
                            </option>
                        ))}
                    </select>
                    <InputError
                        id={`${idPrefix}-priority-error`}
                        message={priorityError}
                    />
                </div>

                <div className="grid gap-2">
                    <label
                        htmlFor={`${idPrefix}-due-at`}
                        className="text-sm font-semibold"
                    >
                        Batas waktu
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
                        aria-describedby={`${idPrefix}-due-at-error`}
                    />
                    <InputError
                        id={`${idPrefix}-due-at-error`}
                        message={dueAtError}
                    />
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
            aria-label="Daftar tugas sedang dimuat"
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
    canCreate,
}: {
    filtered: boolean;
    onCreate: () => void;
    onResetFilters: () => void;
    canCreate: boolean;
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
                        ? 'Tidak ada tugas yang cocok dengan filter'
                        : 'Belum ada tugas di workspace'}
                </h3>
                <p className="mx-auto max-w-[52ch] text-sm leading-6 text-muted-foreground">
                    {filtered
                        ? 'Coba ubah kata kunci atau bersihkan filter untuk melihat seluruh catatan kerja proyek.'
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
                    disabled={!canCreate}
                    data-test="workspace-empty-create"
                >
                    <Plus aria-hidden="true" />
                    Buat tugas pertama
                </Button>
            )}
        </div>
    );
}

export default function ProjectWorkspace({
    project,
    tasks,
    discussion,
    evidence,
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
    const [accessDenied, setAccessDenied] = useState(false);
    const [needsCheck, setNeedsCheck] = useState(false);
    const [commandBusy, setCommandBusy] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);
    const draftDirty = useRef(false);
    const commandLock = useRef(false);
    const checkRequired = useRef(false);
    const detailHeading = useRef<HTMLHeadingElement>(null);
    const focusValidation = useRef(false);
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
        expected_revision: '',
    });
    const transitionForm = useHttp<TransitionTaskData, TaskResponse>({
        status: 'todo',
        expected_revision: '',
    });
    const assignForm = useHttp<AssignmentData, AssignmentResponse>({
        assignee_id: '',
        expected_revision: '',
    });
    const unassignForm = useHttp<AssignmentData, AssignmentResponse>({
        assignee_id: '',
        expected_revision: '',
    });
    const deleteForm = useHttp<DeleteTaskData, DeleteResponse>({
        expected_revision: '',
    });

    const selectedTask = useMemo(
        () => tasks.data.find((task) => task.id === selectedTaskId) ?? null,
        [selectedTaskId, tasks.data],
    );
    const createErrors = createForm.errors as ErrorMap;
    const editErrors = editForm.errors as ErrorMap;
    const transitionErrors = transitionForm.errors as ErrorMap;
    const assignErrors = assignForm.errors as ErrorMap;

    useEffect(() => {
        if (!commandBusy && focusValidation.current) {
            focusValidation.current = false;
            document
                .querySelector<HTMLElement>(
                    '[data-test="workspace-root"] [aria-invalid="true"]',
                )
                ?.focus();
        }
    }, [
        commandBusy,
        createForm.errors,
        editForm.errors,
        assignForm.errors,
        transitionForm.errors,
        unassignForm.errors,
        deleteForm.errors,
    ]);

    function reconciliationProps(
        scopes: Set<RealtimeReconciliationScope>,
    ): string[] {
        if (scopes.has('workspace')) {
            return [
                'project',
                'tasks',
                'discussion',
                'evidence',
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

        if (scopes.has('evidence')) {
            props.add('evidence');
        }

        props.add('project');
        props.add('permissions');

        return Array.from(props);
    }

    function reconciliationStartMessage(
        scopes: Set<RealtimeReconciliationScope>,
        reasons: Set<ReconciliationReason>,
    ): string {
        if (reasons.has('reconnect')) {
            return 'Koneksi kembali. Menyinkronkan data ruang kerja dari database...';
        }

        if (reasons.has('stale')) {
            return 'Data berubah di sesi lain. Memuat versi terbaru dari database...';
        }

        if (reasons.has('manual')) {
            return 'Memuat data ruang kerja terbaru dari database...';
        }

        return scopes.has('discussion') && !scopes.has('tasks')
            ? 'Perubahan diskusi diterima. Menyinkronkan snapshot terbaru dari database...'
            : 'Perubahan tugas diterima. Menyinkronkan snapshot terbaru dari database...';
    }

    function reconciliationSuccessMessage(
        scopes: Set<RealtimeReconciliationScope>,
        reasons: Set<ReconciliationReason>,
    ): string {
        if (reasons.has('reconnect')) {
            return 'Koneksi kembali. Data ruang kerja terbaru sudah disinkronkan dari database.';
        }

        if (reasons.has('stale')) {
            return 'Data terbaru sudah dimuat dari database. Periksa kembali draft sebelum menyimpan.';
        }

        if (reasons.has('manual')) {
            return 'Data ruang kerja terbaru sudah dimuat dari database.';
        }

        return scopes.has('discussion') && !scopes.has('tasks')
            ? 'Snapshot diskusi terbaru sudah disinkronkan dari database.'
            : 'Data tugas terbaru sudah disinkronkan dari database.';
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
            onHttpException: (response) => {
                reconciliationFailed(response.status);

                return false;
            },
            onNetworkError: () => {
                reconciliationFailed();

                return false;
            },
            onSuccess: () => {
                if (!isWorkspaceMounted.current) {
                    return;
                }

                setRealtimeNotice(
                    reconciliationSuccessMessage(scopes, reasons),
                );
                checkRequired.current = false;
                setNeedsCheck(false);

                if (
                    reasons.has('reconnect') ||
                    reasons.has('manual') ||
                    reasons.has('stale') ||
                    reasons.has('command')
                ) {
                    setActionError(null);
                    setActionRecovery(null);
                }

                if (successMessage !== null) {
                    setActionMessage(successMessage);
                }
            },
            onError: () => {
                if (!isWorkspaceMounted.current) {
                    return;
                }

                reconciliationFailed();
            },
            onFinish: () => {
                reconciliationInFlight.current = false;
                flushReconciliation();
            },
        });
    }

    function reconciliationFailed(status?: number): void {
        checkRequired.current = true;
        setNeedsCheck(true);

        if (status === 403 || status === 404) {
            setAccessDenied(true);
        }

        setActionError(
            'Data terbaru belum dapat diperiksa. Perubahan ditahan sampai pemeriksaan berhasil.',
        );
        setActionRecovery('reload');
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
        enabled: !accessDenied,
        institutionId: project.institution_id,
        projectId: project.id,
        onTaskDelta: () => requestRealtimeReconciliation('tasks'),
        onDiscussionDelta: () => requestRealtimeReconciliation('discussion'),
        onAttachmentDelta: () => requestRealtimeReconciliation('evidence'),
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
        const removeBeforeListener = router.on('before', (event) => {
            if (
                event.detail.visit.async ||
                event.detail.visit.url.pathname === window.location.pathname
            ) {
                return;
            }

            if (commandLock.current) {
                return false;
            }

            if (
                draftDirty.current &&
                !window.confirm(
                    'Catatan tugas belum disimpan. Tinggalkan ruang kerja dan buang perubahan ini?',
                )
            ) {
                return false;
            }

            draftDirty.current = false;
            setHasDraft(false);
        });

        return () => {
            removeStartListener();
            removeFinishListener();
            removeBeforeListener();
        };
    }, []);

    useEffect(() => {
        if (
            editorMode !== 'edit' ||
            selectedTask === null ||
            draftDirty.current
        ) {
            return;
        }

        editForm.setData({
            title: selectedTask.title,
            description: selectedTask.description ?? '',
            priority: selectedTask.priority,
            due_at: dateTimeLocalValue(selectedTask.due_at),
            expected_revision: selectedTask.revision,
        });
        // useHttp owns the editor state, so it needs a sync point after a refresh.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editorMode, selectedTask?.id, selectedTask?.revision]);

    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (draftDirty.current || commandLock.current) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', warn);

        return () => window.removeEventListener('beforeunload', warn);
    }, []);

    function selectTask(task: WorkspaceTask) {
        if (!confirmDiscard()) {
            return;
        }

        setSelectedTaskId(task.id);
        setEditorMode('edit');
        clearActionFeedback();
        editForm.clearErrors();
        editForm.setData({
            title: task.title,
            description: task.description ?? '',
            priority: task.priority,
            due_at: dateTimeLocalValue(task.due_at),
            expected_revision: task.revision,
        });
        requestAnimationFrame(() => detailHeading.current?.focus());
    }

    function startCreate() {
        if (!canWrite) {
            return;
        }

        if (!confirmDiscard()) {
            return;
        }

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
    }

    function confirmDiscard(): boolean {
        if (commandLock.current || isRefreshing) {
            return false;
        }

        if (
            draftDirty.current &&
            !window.confirm(
                'Catatan belum disimpan. Tinggalkan perubahan dan buka konteks lain?',
            )
        ) {
            return false;
        }

        draftDirty.current = false;
        setHasDraft(false);

        return true;
    }

    function markDraft(): void {
        draftDirty.current = true;
        setHasDraft(true);
    }
    function unlockCommand(): void {
        commandLock.current = false;
        setCommandBusy(false);
    }

    function commandOptions(fallback: string) {
        return {
            onError: () => {
                focusValidation.current = true;
                setPendingDelete(null);
            },
            onHttpException: (response: { status: number }) => {
                setPendingDelete(null);
                setActionError(requestFailureMessage(response.status));
                setActionRecovery(response.status === 409 ? 'stale' : 'reload');
                checkRequired.current = true;
                setNeedsCheck(true);

                if (response.status === 403 || response.status === 404) {
                    setAccessDenied(true);
                }

                return false;
            },
            onNetworkError: () => {
                setPendingDelete(null);
                setActionError(
                    `${fallback} Hasil belum pasti. Periksa status terbaru sebelum mengirim lagi.`,
                );
                setActionRecovery('reload');
                checkRequired.current = true;
                setNeedsCheck(true);

                return false;
            },
        };
    }

    function reloadWorkspace(successMessage: string): void {
        requestRealtimeReconciliation('tasks', 'command', successMessage);
    }

    function runCreate(): void {
        if (
            !canManage ||
            commandLock.current ||
            checkRequired.current ||
            createForm.processing
        ) {
            return;
        }

        commandLock.current = true;
        setCommandBusy(true);
        clearActionFeedback();
        createForm.transform((data) => ({
            ...data,
            due_at: submittedDueAt(data.due_at),
        }));
        createForm
            .post(ProjectWorkspaceController.store(project.id).url, {
                ...commandOptions('Tugas belum tersimpan.'),
            })
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                draftDirty.current = false;
                setHasDraft(false);
                setSelectedTaskId(response.data.id);
                setEditorMode('edit');
                router.visit(
                    ProjectWorkspaceController.show(project.id, {
                        query: { task: response.data.id },
                    }).url,
                    {
                        preserveState: true,
                        preserveScroll: true,
                        onSuccess: (page) => {
                            setFilterDraft(
                                page.props.filters as TaskWorkspaceFilters,
                            );
                            setActionMessage(
                                'Tugas baru tersimpan. Tetapkan penanggung jawab agar hasil individual jelas.',
                            );
                        },
                        onHttpException: (failure) => {
                            reconciliationFailed(failure.status);

                            return false;
                        },
                        onNetworkError: () => {
                            reconciliationFailed();

                            return false;
                        },
                    },
                );
            })
            .catch(() => undefined)
            .finally(unlockCommand);
    }

    function submitCreate(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        runCreate();
    }

    function runEdit(): void {
        if (
            !canManage ||
            commandLock.current ||
            checkRequired.current ||
            selectedTask === null ||
            editForm.processing
        ) {
            return;
        }

        commandLock.current = true;
        setCommandBusy(true);
        clearActionFeedback();
        editForm.transform((data) => ({
            ...data,
            due_at: submittedDueAt(data.due_at),
        }));
        editForm
            .patch(
                ProjectWorkspaceController.update({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions('Perubahan tugas belum tersimpan.'),
                },
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                draftDirty.current = false;
                setHasDraft(false);
                editForm.setData({
                    ...editForm.data,
                    expected_revision: response.data.revision,
                });
                reloadWorkspace('Detail tugas berhasil diperbarui.');
            })
            .catch(() => undefined)
            .finally(unlockCommand);
    }

    function submitEdit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        runEdit();
    }

    function runTransition(status: TaskStatus): void {
        if (
            !canManage ||
            commandLock.current ||
            checkRequired.current ||
            selectedTask === null ||
            transitionForm.processing
        ) {
            return;
        }

        commandLock.current = true;
        setCommandBusy(true);
        clearActionFeedback();
        transitionForm.transform((data) => ({
            ...data,
            status,
            expected_revision: selectedTask.revision,
        }));
        transitionForm
            .post(
                ProjectWorkspaceController.transition({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions('Status tugas belum berubah.'),
                },
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                reloadWorkspace(
                    `Status tugas menjadi ${statusLabels[status]}.`,
                );
            })
            .catch(() => undefined)
            .finally(unlockCommand);
    }

    function transitionTask(status: TaskStatus): void {
        runTransition(status);
    }

    function runAssignTask(): void {
        if (
            !canManage ||
            commandLock.current ||
            checkRequired.current ||
            selectedTask === null ||
            assignForm.processing ||
            assignForm.data.assignee_id === ''
        ) {
            return;
        }

        commandLock.current = true;
        setCommandBusy(true);
        clearActionFeedback();
        assignForm.transform((data) => ({
            ...data,
            expected_revision: selectedTask.revision,
        }));
        assignForm
            .post(
                ProjectWorkspaceController.assign({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions('Penanggung jawab belum ditambahkan.'),
                },
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                assignForm.setData('assignee_id', '');
                reloadWorkspace('Penanggung jawab tugas berhasil diperbarui.');
            })
            .catch(() => undefined)
            .finally(unlockCommand);
    }

    function assignTask(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        runAssignTask();
    }

    function runUnassignTask(userId: number): void {
        if (
            !canManage ||
            commandLock.current ||
            checkRequired.current ||
            selectedTask === null ||
            unassignForm.processing
        ) {
            return;
        }

        commandLock.current = true;
        setCommandBusy(true);
        clearActionFeedback();
        unassignForm.transform((data) => ({
            ...data,
            assignee_id: userId,
            expected_revision: selectedTask.revision,
        }));
        unassignForm
            .delete(
                ProjectWorkspaceController.unassign({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions('Penanggung jawab belum dilepas.'),
                },
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                unassignForm.setData('assignee_id', '');
                reloadWorkspace('Penanggung jawab tugas berhasil dilepas.');
            })
            .catch(() => undefined)
            .finally(unlockCommand);
    }

    function unassignTask(userId: number): void {
        runUnassignTask(userId);
    }

    function runDeleteTask(): void {
        if (
            !canManage ||
            commandLock.current ||
            checkRequired.current ||
            pendingDelete === null ||
            deleteForm.processing
        ) {
            return;
        }

        const task = pendingDelete;
        commandLock.current = true;
        setCommandBusy(true);
        clearActionFeedback();
        deleteForm.transform(() => ({ expected_revision: task.revision }));
        deleteForm
            .delete(
                ProjectWorkspaceController.destroy({
                    project: project.id,
                    task: task.id,
                }).url,
                {
                    ...commandOptions('Tugas belum dapat dihapus.'),
                },
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                setPendingDelete(null);
                setSelectedTaskId(null);
                setEditorMode('create');
                reloadWorkspace('Tugas berhasil dihapus dari workspace.');
            })
            .catch(() => undefined)
            .finally(unlockCommand);
    }

    function deleteTask(): void {
        runDeleteTask();
    }

    function applyFilters(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!confirmDiscard()) {
            return;
        }

        clearActionFeedback();
        setEditorMode('edit');
        router.visit(
            ProjectWorkspaceController.show(project.id, {
                query: {
                    q: filterDraft.q || null,
                    status: filterDraft.status,
                    priority: filterDraft.priority,
                    per_page: filterDraft.per_page,
                    scope: filterDraft.scope,
                    task: null,
                },
            }).url,
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const next = page.props.tasks as TaskPage;
                    setSelectedTaskId(next.data[0]?.id ?? null);
                    setFilterDraft(page.props.filters as TaskWorkspaceFilters);
                },
                onHttpException: (response) => {
                    reconciliationFailed(response.status);

                    return false;
                },
                onNetworkError: () => {
                    reconciliationFailed();

                    return false;
                },
            },
        );
    }

    function changePage(page: number) {
        if (!confirmDiscard()) {
            return;
        }

        setEditorMode('edit');

        router.visit(
            ProjectWorkspaceController.show(project.id, {
                query: {
                    q: filters.q || null,
                    status: filters.status,
                    priority: filters.priority,
                    per_page: filters.per_page,
                    scope: filters.scope,
                    task: filters.task,
                    page,
                },
            }).url,
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const next = page.props.tasks as TaskPage;
                    setSelectedTaskId(next.data[0]?.id ?? null);
                    setFilterDraft(page.props.filters as TaskWorkspaceFilters);
                },
                onHttpException: (response) => {
                    reconciliationFailed(response.status);

                    return false;
                },
                onNetworkError: () => {
                    reconciliationFailed();

                    return false;
                },
            },
        );
    }

    function resetFilters() {
        if (!confirmDiscard()) {
            return;
        }

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
                onHttpException: (response) => {
                    reconciliationFailed(response.status);

                    return false;
                },
                onNetworkError: () => {
                    reconciliationFailed();

                    return false;
                },
            },
        );
    }

    function recoverAction(): void {
        const recovery = actionRecovery;

        setActionError(null);
        setActionRecovery(null);

        requestWorkspaceReconciliation(
            recovery === 'stale' ? 'stale' : 'manual',
        );
    }

    const draftConflict =
        editorMode === 'edit' &&
        selectedTask !== null &&
        editForm.data.expected_revision !== '' &&
        editForm.data.expected_revision !== selectedTask.revision;
    const canWrite =
        permissions.can_manage_tasks &&
        !needsCheck &&
        !commandBusy &&
        !isRefreshing &&
        realtime.connectionState !== 'offline';
    const canManage = canWrite && !draftConflict;
    const detailErrors = editErrors;
    const selectedTransitionErrors = transitionErrors;
    const activeSelectedTaskId = selectedTask?.id ?? null;
    const hasActiveFilter = Boolean(
        filters.q ||
        filters.status !== null ||
        filters.priority !== null ||
        filters.scope !== 'all' ||
        filters.task !== null,
    );

    if (accessDenied) {
        return (
            <AppPage>
                <Head title="Ruang kerja" />
                <section
                    className="rounded-3xl border border-border bg-card p-6"
                    data-test="workspace-access-denied"
                >
                    <h1 className="text-title font-semibold">
                        Akses ruang kerja tidak tersedia
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Data privat sebelumnya disembunyikan. Periksa
                        keanggotaan dan konteks kampus melalui Proyek.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href={projectsIndex({ query: { view: 'mine' } })}>
                            Kembali ke proyek saya
                        </Link>
                    </Button>
                </section>
            </AppPage>
        );
    }

    return (
        <>
            <Head title={`Ruang kerja · ${project.title}`} />
            <AppPage
                contextRail={
                    <WorkspaceContextRail project={project} tasks={tasks} />
                }
                contextRailLabel="Konteks ruang kerja proyek"
            >
                <div
                    data-test="workspace-root"
                    aria-busy={isRefreshing}
                    className="grid min-w-0 gap-6 motion-reduce:[&_*]:transition-none motion-reduce:[&_svg]:animate-none"
                >
                    <header className="grid gap-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-8">
                        <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className="font-label text-label text-muted-foreground">
                                    RUANG KERJA PROYEK{' '}
                                    {String(project.id).padStart(4, '0')}
                                </span>
                                <span className="border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">
                                    Ruang kerja tim
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
                                Temukan tanggung jawabmu, kerjakan hasil yang
                                jelas, lalu simpan bukti privat. Diskusi
                                tersedia bila dibutuhkan.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            <Button
                                asChild
                                variant="ghost"
                                className="cursor-pointer"
                            >
                                <Link href={projectShow(project.id)}>
                                    Kembali ke detail proyek
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                disabled={isRefreshing || commandBusy}
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
                                    Tugas baru
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
                                Memuat data ruang kerja terbaru...
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
                            className="flex flex-wrap items-start justify-between gap-3 border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
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
                                    className="min-h-11 cursor-pointer px-2 py-1 text-xs font-semibold underline underline-offset-2 hover:no-underline"
                                    disabled={isRefreshing || commandBusy}
                                    onClick={recoverAction}
                                    data-test="workspace-action-recovery"
                                >
                                    Periksa status terbaru
                                </button>
                                <button
                                    type="button"
                                    className="min-h-11 min-w-11 cursor-pointer p-1 text-current hover:opacity-70"
                                    aria-label="Tutup pesan error"
                                    onClick={() => {
                                        setActionError(null);
                                        setActionRecovery(null);
                                    }}
                                >
                                    <X aria-hidden="true" className="size-4" />
                                </button>
                            </span>
                        </div>
                    )}

                    {!permissions.can_manage_tasks && (
                        <div
                            data-test="workspace-read-only"
                            className="flex items-start gap-2 border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
                        >
                            <LockKeyhole
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            <p>
                                Mode baca. Izin perubahan tugas tidak tersedia
                                untuk akun ini.
                            </p>
                        </div>
                    )}

                    <section
                        className="grid gap-2 rounded-2xl bg-accent/60 p-4"
                        aria-label="Arahan pekerjaan"
                    >
                        <h2 className="text-base font-semibold">
                            Mulai dari pekerjaan, bukan percakapan
                        </h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Pilih Tugas saya untuk melanjutkan tanggung jawabmu.
                            Belum ditugaskan membantu tim membagi pekerjaan.
                            Setelah bekerja, unggah bukti privat di bawah ini.
                        </p>
                        {hasDraft && (
                            <p role="status" className="text-sm text-primary">
                                Ada catatan tugas yang belum disimpan. Refresh
                                tidak menghapusnya.
                            </p>
                        )}
                    </section>
                    {editorMode === 'edit' &&
                        selectedTask === null &&
                        hasDraft && (
                            <section
                                className="grid gap-3 rounded-2xl border border-pending/40 bg-pending-subtle p-4"
                                data-test="task-missing-draft"
                            >
                                <h2 className="text-base font-semibold">
                                    Tugas tidak ada dalam daftar terbaru
                                </h2>
                                <p className="text-sm">
                                    Catatan belum disimpan tetap tersedia di
                                    bawah. Salin bila dibutuhkan sebelum memilih
                                    tugas lain. Data yang hilang tidak dikirim
                                    ulang.
                                </p>
                                <label
                                    htmlFor="missing-task-draft"
                                    className="text-sm font-semibold"
                                >
                                    Draft catatan: {editForm.data.title}
                                </label>
                                <textarea
                                    id="missing-task-draft"
                                    readOnly
                                    value={editForm.data.description}
                                    className={textAreaClassName}
                                />
                            </section>
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
                                    FILTER TUGAS
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Gunakan filter untuk menemukan pekerjaan
                                    tanpa mengubah urutan ledger.
                                </p>
                            </div>
                        </div>
                        <div
                            className="flex flex-wrap gap-2"
                            aria-label="Cakupan tugas"
                        >
                            {(
                                [
                                    ['all', 'Semua tugas'],
                                    ['mine', 'Tugas saya'],
                                    ['unassigned', 'Belum ditugaskan'],
                                ] as const
                            ).map(([scope, label]) => (
                                <Button
                                    key={scope}
                                    type="button"
                                    variant={
                                        filters.scope === scope
                                            ? 'default'
                                            : 'outline'
                                    }
                                    aria-pressed={filters.scope === scope}
                                    disabled={isRefreshing || commandBusy}
                                    data-test={`workspace-scope-${scope}`}
                                    onClick={() => {
                                        if (!confirmDiscard()) {
                                            return;
                                        }

                                        setSelectedTaskId(null);
                                        setEditorMode('edit');
                                        setFilterDraft({
                                            ...filterDraft,
                                            scope,
                                            page: 1,
                                            task: null,
                                        });
                                        router.visit(
                                            ProjectWorkspaceController.show(
                                                project.id,
                                                {
                                                    query: {
                                                        ...filters,
                                                        scope,
                                                        page: 1,
                                                        task: null,
                                                    },
                                                },
                                            ).url,
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                                onSuccess: (page) => {
                                                    const next = page.props
                                                        .tasks as TaskPage;
                                                    setSelectedTaskId(
                                                        next.data[0]?.id ??
                                                            null,
                                                    );
                                                },
                                                onHttpException: (response) => {
                                                    reconciliationFailed(
                                                        response.status,
                                                    );

                                                    return false;
                                                },
                                                onNetworkError: () => {
                                                    reconciliationFailed();

                                                    return false;
                                                },
                                            },
                                        );
                                    }}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                        {filters.task !== null && (
                            <p className="text-sm text-primary">
                                Sedang melihat satu tugas. Bersihkan filter
                                untuk melihat tugas lainnya.
                            </p>
                        )}
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
                                    Cari tugas
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

                    <section
                        aria-labelledby="workspace-tasks-title"
                        className="grid min-w-0 gap-5"
                    >
                        <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0 space-y-1">
                                <h2
                                    id="workspace-tasks-title"
                                    tabIndex={-1}
                                    className="text-title font-semibold"
                                >
                                    Daftar tugas
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {tasks.meta.total === 0
                                        ? 'Belum ada hasil pada filter ini.'
                                        : `${tasks.meta.total} tugas dalam konteks workspace ini.`}
                                </p>
                                <p
                                    className="max-w-prose text-sm leading-6 text-muted-foreground"
                                    data-test="workspace-collaboration-guidance"
                                >
                                    Sepakati hasil bersama, bagi bagian
                                    pekerjaan dan tentukan siapa yang memeriksa
                                    hasil rekan. Percakapan bersifat opsional.
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
                                    canCreate={canWrite}
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
                                                    TUGAS BARU
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
                                                onChange={(field, value) => (
                                                    markDraft(),
                                                    createForm.setData(
                                                        field,
                                                        field === 'priority'
                                                            ? (value as TaskPriority)
                                                            : value,
                                                    )
                                                )}
                                                idPrefix="task-create"
                                            />
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                                                <p className="text-xs leading-5 text-muted-foreground">
                                                    Tenggat tugas tidak boleh
                                                    melewati tenggat proyek.
                                                </p>
                                                <Button
                                                    type="submit"
                                                    className="cursor-pointer"
                                                    disabled={
                                                        !canWrite ||
                                                        createForm.processing
                                                    }
                                                    data-test="task-create-submit"
                                                >
                                                    {createForm.processing && (
                                                        <Spinner aria-hidden="true" />
                                                    )}
                                                    <Plus aria-hidden="true" />
                                                    Tambahkan tugas
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
                                    className="min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
                                >
                                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                                        <h3
                                            id="workspace-list-title"
                                            className="font-label text-label text-muted-foreground"
                                        >
                                            DAFTAR TUGAS
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
                                    className="min-w-0 rounded-3xl border border-border bg-background shadow-sm"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
                                        <div className="min-w-0">
                                            <p className="font-label text-label text-muted-foreground">
                                                {editorMode === 'create'
                                                    ? 'TUGAS BARU'
                                                    : selectedTask
                                                      ? `TASK ${String(selectedTask.id).padStart(4, '0')}`
                                                      : 'DETAIL TUGAS'}
                                            </p>
                                            <h3
                                                id="workspace-detail-title"
                                                ref={detailHeading}
                                                tabIndex={-1}
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

                                    {draftConflict && (
                                        <div
                                            role="alert"
                                            className="m-4 grid gap-3 rounded-2xl border border-pending/40 bg-pending-subtle p-4 text-sm"
                                            data-test="task-draft-conflict"
                                        >
                                            <p>
                                                Tugas berubah sejak kamu membuka
                                                editor. Draft tetap
                                                dipertahankan. Periksa judul,
                                                catatan, status, dan penanggung
                                                jawab terbaru sebelum
                                                melanjutkan.
                                            </p>
                                            <p className="wrap-anywhere whitespace-pre-wrap">
                                                Catatan tersimpan:{' '}
                                                {selectedTask?.description ||
                                                    'Belum ada catatan.'}
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    if (selectedTask) {
                                                        selectTask(
                                                            selectedTask,
                                                        );
                                                    }
                                                }}
                                                data-test="task-use-latest"
                                            >
                                                Gunakan data terbaru
                                            </Button>
                                        </div>
                                    )}
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
                                                onChange={(field, value) => (
                                                    markDraft(),
                                                    createForm.setData(
                                                        field,
                                                        field === 'priority'
                                                            ? (value as TaskPriority)
                                                            : value,
                                                    )
                                                )}
                                                idPrefix="task-create"
                                            />
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                                                <p className="text-xs leading-5 text-muted-foreground">
                                                    Tenggat tugas tidak boleh
                                                    melewati tenggat proyek.
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
                                                    Tambahkan tugas
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
                                                    onChange={(
                                                        field,
                                                        value,
                                                    ) => (
                                                        markDraft(),
                                                        editForm.setData(
                                                            field,
                                                            field === 'priority'
                                                                ? (value as TaskPriority)
                                                                : value,
                                                        )
                                                    )}
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
                                                        STATUS PEKERJAAN
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
                                                        Pilih anggota aktif tim
                                                        untuk memperjelas serah
                                                        terima.
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
                                                    Penghapusan tugas tidak
                                                    dapat dibatalkan dari
                                                    halaman ini.
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
                                                    Hapus tugas
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
                                                    Buat tugas baru
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
                    </section>
                    <WorkspaceEvidence
                        projectId={project.id}
                        initialPage={evidence}
                        disabled={!canWrite}
                        onForbidden={() => setAccessDenied(true)}
                    />
                    <WorkspaceDiscussion
                        disabled={!canWrite}
                        onForbidden={() => setAccessDenied(true)}
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
                <DialogContent
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        const trigger =
                            document.querySelector<HTMLButtonElement>(
                                '[data-test="task-delete"]',
                            );

                        if (trigger && !trigger.disabled) {
                            trigger.focus();
                        } else {
                            document
                                .getElementById('workspace-tasks-title')
                                ?.focus();
                        }
                    }}
                    closeButtonDisabled={commandBusy || isRefreshing}
                >
                    <DialogTitle>Hapus tugas ini?</DialogTitle>
                    <DialogDescription>
                        Tugas “{pendingDelete?.title}” dan penanggung jawabnya
                        akan dihapus dari workspace. Riwayat audit tetap
                        dipertahankan.
                    </DialogDescription>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                disabled={
                                    commandBusy ||
                                    isRefreshing ||
                                    deleteForm.processing
                                }
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
            title: 'Proyek',
            href: projectsIndex(),
        },
        {
            title: 'Ruang kerja proyek',
        },
    ],
};
