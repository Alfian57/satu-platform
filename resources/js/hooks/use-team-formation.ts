import { router, useHttp } from '@inertiajs/react';
import { useRef, useState } from 'react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
import {
    acceptInvitation,
    acceptJoinRequest,
    rejectInvitation,
    rejectJoinRequest,
    requestJoin,
    revokeInvitation,
    withdrawJoinRequest,
} from '@/actions/App/Http/Controllers/TeamTransitionController';
import {
    emptyApplication,
    firstError,
    focusTeam,
    reloadKeys,
} from '@/components/projects/team/team-utils';
import type {
    Application,
    CommandResponse,
    Decision,
} from '@/components/projects/team/team-utils';
import type { ProjectRole, TeamFormationState } from '@/types/project';

export interface UseTeamFormationOptions {
    projectId: number;
    roles: ProjectRole[];
    team: TeamFormationState;
    canWorkspace?: boolean;
    onAccessDenied?: () => void;
}

export function useTeamFormation({
    projectId,
    roles,
    team,
    onAccessDenied,
}: UseTeamFormationOptions) {
    const joinForm = useHttp<Application, CommandResponse>(emptyApplication);
    const decisionForm = useHttp<
        { reason: string; expected_revision: string },
        CommandResponse
    >({ reason: '', expected_revision: '' });
    const [decision, setDecision] = useState<Decision | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [mustCheck, setMustCheck] = useState(false);
    const commandLock = useRef(false);
    const refreshLock = useRef(false);
    const needsCheck = useRef(false);
    const triggerRef = useRef<HTMLElement | null>(null);
    const feedbackRef = useRef<HTMLDivElement | null>(null);

    const owner = team.permissions.can_manage_requests;
    const busy = joinForm.processing || decisionForm.processing || syncing;
    const blocked = busy || mustCheck;
    const joinErrors = joinForm.errors as Record<string, unknown>;
    const decisionErrors = decisionForm.errors as Record<string, unknown>;
    const validation = firstError(decision ? decisionErrors : joinErrors);
    const selectedRole = roles.find(
        (role) => role.id === joinForm.data.project_role_id,
    );
    const history = team.request_history;
    const isJoinDecision =
        decision?.kind === 'accept-request' ||
        decision?.kind === 'reject-request';
    const accepting =
        decision?.kind === 'accept-request' ||
        decision?.kind === 'accept-invitation';
    const withdrawing = decision?.kind === 'withdraw-request';

    function announceError(text: string, uncertain = false): void {
        setError(text);

        if (uncertain) {
            needsCheck.current = true;
            setMustCheck(true);
        }

        requestAnimationFrame(() => feedbackRef.current?.focus());
    }

    function httpFailure(response: { status: number }): boolean {
        if (response.status === 403 || response.status === 404) {
            onAccessDenied?.();
        }

        announceError(
            response.status === 409
                ? 'Pengajuan, kriteria, atau kapasitas berubah. Periksa status terbaru dan tinjau kembali sebelum melanjutkan.'
                : 'Hasil tindakan belum dapat dipastikan. Periksa status terbaru sebelum mengirim ulang.',
            true,
        );

        return false;
    }

    function reload(successMessage?: string, page?: number): void {
        if (refreshLock.current) {
            return;
        }

        refreshLock.current = true;
        commandLock.current = true;
        setSyncing(true);
        const options = {
            only: reloadKeys,
            preserveScroll: true,
            onSuccess: () => {
                needsCheck.current = false;
                setMustCheck(false);
                setError(null);
                setDecision(null);
                decisionForm.clearErrors();
                joinForm.clearErrors();
                setMessage(
                    successMessage ??
                        'Status terbaru sudah diperiksa. Tinjau informasi sebelum melanjutkan.',
                );
                requestAnimationFrame(focusTeam);
            },
            onError: () =>
                announceError(
                    'Status terbaru belum dapat dimuat. Coba periksa kembali.',
                    true,
                ),
            onNetworkError: () => {
                announceError(
                    'Status terbaru belum dapat dimuat. Pengiriman tetap dikunci sampai status berhasil diperiksa.',
                    true,
                );

                return false;
            },
            onHttpException: httpFailure,
            onCancel: () =>
                announceError(
                    'Pemeriksaan status terhenti. Periksa kembali sebelum mengirim tindakan.',
                    true,
                ),
            onFinish: () => {
                refreshLock.current = false;
                commandLock.current = needsCheck.current;
                setSyncing(false);
            },
        };

        if (page === undefined) {
            router.reload(options);
        } else {
            router.get(
                ProjectController.show(projectId).url,
                { team_history_page: page },
                { ...options, preserveState: true },
            );
        }
    }

    function startCommand(): boolean {
        if (commandLock.current || needsCheck.current) {
            return false;
        }

        commandLock.current = true;
        setError(null);
        setMessage(null);

        return true;
    }

    function finishCommand(): void {
        if (!refreshLock.current) {
            commandLock.current = needsCheck.current;
        }
    }

    function openDecision(target: Decision): void {
        if (blocked || commandLock.current) {
            return;
        }

        triggerRef.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
        setError(null);
        decisionForm.clearErrors();
        decisionForm.setData({
            reason: '',
            expected_revision: target.revision ?? '',
        });
        setDecision(target);
    }

    function closeDecision(): void {
        setDecision(null);
    }

    function setJoinField(
        field: keyof Application,
        value: string | number | null,
    ): void {
        joinForm.setData(field, value as never);
    }

    function setDecisionReason(reason: string): void {
        decisionForm.setData('reason', reason);
    }

    function submitJoin(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (!startCommand()) {
            return;
        }

        joinForm
            .post(requestJoin(projectId).url, {
                onSuccess: () => {
                    joinForm.setData(emptyApplication);
                    reload(
                        'Pengajuan terkirim. Menunggu keputusan pemilik, belum menjadi anggota tim.',
                    );
                },
                onError: () =>
                    requestAnimationFrame(() => feedbackRef.current?.focus()),
                onHttpException: httpFailure,
                onNetworkError: () => {
                    announceError(
                        'Hasil pengajuan belum dapat dipastikan. Periksa status terbaru, jangan mengirim ulang dahulu.',
                        true,
                    );

                    return false;
                },
                onFinish: finishCommand,
            })
            .catch(() => undefined);
    }

    function submitDecision(): void {
        if (!decision || !startCommand()) {
            return;
        }

        const routes = {
            'accept-invitation': acceptInvitation,
            'reject-invitation': rejectInvitation,
            'revoke-invitation': revokeInvitation,
            'accept-request': acceptJoinRequest,
            'reject-request': rejectJoinRequest,
            'withdraw-request': withdrawJoinRequest,
        };
        const successMessages = {
            'accept-invitation':
                'Undangan diterima. Keanggotaan aktif sudah tercatat.',
            'reject-invitation':
                'Undangan ditolak. Kamu tetap dapat menemukan peluang lain.',
            'revoke-invitation': 'Undangan dibatalkan dan tidak lagi berlaku.',
            'accept-request':
                'Pengajuan diterima. Keanggotaan dan kapasitas sudah tersimpan bersama.',
            'reject-request':
                'Keputusan tersimpan. Pemohon dapat membaca alasan dan mencari peran lain.',
            'withdraw-request':
                'Pengajuan ditarik. Riwayat tetap tersimpan dan tidak memakai tempat tim.',
        };

        decisionForm
            .post(routes[decision.kind](decision.id).url, {
                onSuccess: () => {
                    setDecision(null);
                    reload(successMessages[decision.kind]);
                },
                onError: () =>
                    requestAnimationFrame(() => feedbackRef.current?.focus()),
                onHttpException: httpFailure,
                onNetworkError: () => {
                    announceError(
                        'Hasil keputusan belum dapat dipastikan. Periksa status terbaru sebelum mengambil tindakan lagi.',
                        true,
                    );

                    return false;
                },
                onFinish: finishCommand,
            })
            .catch(() => undefined);
    }

    return {
        state: {
            joinData: joinForm.data,
            joinErrors,
            joinProcessing: joinForm.processing,
            decisionReason: decisionForm.data.reason,
            decisionErrors,
            decisionProcessing: decisionForm.processing,
            decision,
            error,
            message,
            syncing,
            mustCheck,
            owner,
            busy,
            blocked,
            validation,
            selectedRole,
            history,
            isJoinDecision,
            accepting,
            withdrawing,
        },
        actions: {
            setJoinField,
            setDecisionReason,
            openDecision,
            closeDecision,
            submitJoin,
            submitDecision,
            reload,
            announceError,
        },
        refs: {
            feedbackRef,
            triggerRef,
            commandLock,
            refreshLock,
            needsCheck,
        },
        feedbackRef,
        triggerRef,
    };
}

export type UseTeamFormationReturn = ReturnType<typeof useTeamFormation>;
