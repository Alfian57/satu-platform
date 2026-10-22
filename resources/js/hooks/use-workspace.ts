import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import ProjectWorkspaceController from '@/actions/App/Http/Controllers/ProjectWorkspaceController';
import type {
    RealtimeReconciliationScope,
    ReconciliationReason,
    WorkspaceRecoveryAction,
} from '@/components/projects/workspace/workspace-utils';
import { useWorkspaceRealtime } from '@/hooks/use-workspace-realtime';
import type {
    DiscussionPage,
    TaskPage,
    TaskWorkspaceFilters,
    TaskWorkspacePermissions,
    WorkspaceEvidencePage,
    WorkspaceMember,
    WorkspaceProject,
} from '@/types';

export interface UseWorkspaceOptions {
    project: WorkspaceProject;
    tasks: TaskPage;
    discussion: DiscussionPage;
    evidence: WorkspaceEvidencePage;
    members: WorkspaceMember[];
    filters: TaskWorkspaceFilters;
    permissions: TaskWorkspacePermissions;
    onTasksFiltered?: (newTasks: TaskPage) => void;
}

export function useWorkspace({
    project,
    filters,
    permissions,
    onTasksFiltered,
}: UseWorkspaceOptions) {
    const [filterDraft, setFilterDraft] = useState(filters);
    const [accessDenied, setAccessDenied] = useState(false);
    const [needsCheck, setNeedsCheck] = useState(false);
    const [commandBusy, setCommandBusy] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);
    const draftDirty = useRef(false);
    const commandLock = useRef(false);
    const checkRequired = useRef(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionRecovery, setActionRecovery] =
        useState<WorkspaceRecoveryAction | null>(null);
    const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

    const reconciliationQueue = useRef<Set<RealtimeReconciliationScope>>(
        new Set(),
    );
    const reconciliationReasons = useRef<Set<ReconciliationReason>>(new Set());
    const reconciliationInFlight = useRef(false);
    const reconciliationSuccessNotice = useRef<string | null>(null);
    const isWorkspaceMounted = useRef(true);

    const hasActiveFilter = Boolean(
        filters.q ||
        filters.status !== null ||
        filters.priority !== null ||
        filters.scope !== 'all' ||
        filters.task !== null,
    );

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

    function lockCommand(): void {
        commandLock.current = true;
    }

    function setCheckRequired(required: boolean): void {
        checkRequired.current = required;
        setNeedsCheck(required);
    }

    function setDraftDirty(dirty: boolean): void {
        draftDirty.current = dirty;
        setHasDraft(dirty);
    }

    function unlockCommand(): void {
        commandLock.current = false;
        setCommandBusy(false);
    }

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
        const warn = (event: BeforeUnloadEvent) => {
            if (draftDirty.current || commandLock.current) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', warn);

        return () => window.removeEventListener('beforeunload', warn);
    }, []);

    function recoverAction(): void {
        if (actionRecovery === 'stale') {
            requestRealtimeReconciliation('tasks', 'stale');

            return;
        }

        requestWorkspaceReconciliation('manual');
    }

    function applyFilters(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!confirmDiscard()) {
            return;
        }

        clearActionFeedback();
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
                    onTasksFiltered?.(next);
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
                onSuccess: (p) => {
                    const next = p.props.tasks as TaskPage;
                    onTasksFiltered?.(next);
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
        const resetState: TaskWorkspaceFilters = {
            q: '',
            status: null,
            priority: null,
            per_page: filters.per_page,
            scope: 'all',
            task: null,
            page: 1,
        };
        setFilterDraft(resetState);
        router.visit(
            ProjectWorkspaceController.show(project.id, {
                query: {
                    q: null,
                    status: null,
                    priority: null,
                    per_page: filters.per_page,
                    scope: 'all',
                    task: null,
                },
            }).url,
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const next = page.props.tasks as TaskPage;
                    onTasksFiltered?.(next);
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

    const canWrite =
        permissions.can_manage_tasks &&
        !needsCheck &&
        !commandBusy &&
        !isRefreshing &&
        realtime.connectionState !== 'offline';

    return {
        state: {
            filterDraft,
            accessDenied,
            needsCheck,
            commandBusy,
            hasDraft,
            isRefreshing,
            actionMessage,
            actionError,
            actionRecovery,
            realtimeNotice,
            hasActiveFilter,
            canWrite,
        },
        actions: {
            setFilterDraft,
            clearActionFeedback,
            markDraft,
            confirmDiscard,
            lockCommand,
            unlockCommand,
            setCheckRequired,
            setDraftDirty,
            recoverAction,
            applyFilters,
            changePage,
            resetFilters,
            requestRealtimeReconciliation,
            requestWorkspaceReconciliation,
            setAccessDenied,
            setActionError,
            setActionMessage,
            setCommandBusy,
            reconciliationFailed,
        },
        realtime,
        refs: {
            commandLock,
            draftDirty,
            checkRequired,
        },
    };
}

export type UseWorkspaceReturn = ReturnType<typeof useWorkspace>;
