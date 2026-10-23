import { router, useHttp, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
import type { TransitionAction } from '@/pages/projects/show/_components/show-utils';
import type { Auth } from '@/types/auth';
import type {
    ProjectApiResponse,
    ProjectDetail,
    ProjectStatus,
    ProjectTransitionData,
    TeamFormationState,
} from '@/types/project';

type PageProps = {
    auth: Auth;
};

export type UseProjectShowOptions = {
    initialProject: ProjectDetail;
    team: TeamFormationState;
    canEdit: boolean;
    canTransition: boolean;
    canWorkspace: boolean;
};

export function useProjectShow({
    initialProject,
    team,
    canEdit,
    canTransition,
}: UseProjectShowOptions) {
    const { auth } = usePage<PageProps>().props;
    const [project, setProject] = useState(initialProject);
    const [accessDenied, setAccessDenied] = useState(false);
    const [pendingAction, setPendingAction] = useState<TransitionAction | null>(
        null,
    );
    const actionTrigger = useRef<HTMLElement | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const transitionForm = useHttp<ProjectTransitionData, ProjectApiResponse>({
        reason: '',
        expected_updated_at: initialProject.updated_at,
    });

    const transitionErrors = transitionForm.errors as Record<
        string,
        string | string[] | undefined
    >;

    const normalizedCanEdit =
        canEdit && ['draft', 'open'].includes(project.status);
    const isOwner = auth.user?.id === project.owner_id;
    const canRequestJoin =
        team.permissions.can_request_join &&
        !team.permissions.can_manage_requests &&
        !team.permissions.can_manage_invitations &&
        !team.current_membership &&
        !team.pending_join_request &&
        team.pending_invitations.length === 0;
    const status = project.status as ProjectStatus;

    const allSkills = useMemo(
        () =>
            Array.from(
                new Map(
                    project.roles
                        .flatMap((role) => role.skills)
                        .map((skill) => [skill.taxonomy_id, skill]),
                ).values(),
            ),
        [project.roles],
    );

    useEffect(() => {
        const frame = requestAnimationFrame(() => setProject(initialProject));

        return () => cancelAnimationFrame(frame);
    }, [initialProject]);

    useEffect(() => {
        const isTeamOnlyReload = (visit: { only: string[] }): boolean =>
            visit.only.includes('team') &&
            visit.only.every((key) =>
                [
                    'team',
                    'project',
                    'can_edit',
                    'can_transition',
                    'can_workspace',
                ].includes(key),
            );

        const removeStartListener = router.on('start', (event) => {
            if (!isTeamOnlyReload(event.detail.visit)) {
                setIsRefreshing(true);
            }
        });

        const removeFinishListener = router.on('finish', (event) => {
            if (!isTeamOnlyReload(event.detail.visit)) {
                setIsRefreshing(false);
            }
        });

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    const transitionErrorMessage = (): string | undefined => {
        const message = transitionErrors.status ?? transitionErrors.reason;

        return Array.isArray(message) ? message[0] : message;
    };

    const runTransition = (action: 'open' | TransitionAction): void => {
        setActionMessage(null);
        setActionError(null);
        transitionForm.transform((data) => ({
            ...data,
            expected_updated_at: project.updated_at,
            ...(action === 'open' ? { occupied_capacity: 0, reason: '' } : {}),
        }));

        const requestOptions = {
            onHttpException: (response: { status: number }) => {
                if (response.status === 403 || response.status === 404) {
                    setAccessDenied(true);
                }

                setActionError(
                    response.status === 409
                        ? 'Proyek sudah berubah di sesi lain. Muat ulang halaman sebelum mencoba lagi.'
                        : 'Status proyek belum dapat diubah. Periksa status dan batas waktunya.',
                );

                return false;
            },
            onNetworkError: () => {
                setActionError(
                    'Perubahan status proyek belum tersimpan. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
        };

        const request =
            action === 'open'
                ? transitionForm.post(
                      ProjectController.open(project.id).url,
                      requestOptions,
                  )
                : action === 'cancel'
                  ? transitionForm.post(
                        ProjectController.cancel(project.id).url,
                        requestOptions,
                    )
                  : transitionForm.post(
                        ProjectController.archive(project.id).url,
                        requestOptions,
                    );

        request
            .then((response) => {
                if (response === undefined) {
                    return;
                }

                setProject(response.data);
                setActionError(null);
                transitionForm.setData({
                    expected_updated_at: response.data.updated_at,
                    reason: '',
                });
                setPendingAction(null);
                setActionMessage(
                    action === 'open'
                        ? 'Proyek berhasil dibuka.'
                        : action === 'cancel'
                          ? 'Proyek berhasil dibatalkan.'
                          : 'Proyek berhasil diarsipkan.',
                );
            })
            .catch(() => undefined);
    };

    const openDestructiveAction = (
        action: TransitionAction,
        trigger?: HTMLElement | null,
    ): void => {
        actionTrigger.current = trigger ?? null;
        setPendingAction(action);
    };

    const closeDestructiveAction = (): void => {
        if (!transitionForm.processing) {
            setPendingAction(null);
        }
    };

    const setTransitionReason = (reason: string): void => {
        transitionForm.setData('reason', reason);
    };

    return {
        project,
        accessDenied,
        pendingAction,
        actionTrigger,
        actionMessage,
        actionError,
        isRefreshing,
        isOwner,
        canRequestJoin,
        normalizedCanEdit,
        canTransition,
        status,
        allSkills,
        isProcessing: transitionForm.processing,
        transitionReason: transitionForm.data.reason,
        transitionErrorMessage: transitionErrorMessage(),
        actions: {
            runTransition,
            openDestructiveAction,
            closeDestructiveAction,
            setTransitionReason,
            setAccessDenied,
        },
    };
}
