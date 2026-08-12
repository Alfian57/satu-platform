import { router, useHttp } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleAlert,
    Inbox,
    LockKeyhole,
    Send,
    ShieldCheck,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    acceptInvitation,
    acceptJoinRequest,
    rejectInvitation,
    rejectJoinRequest,
    revokeInvitation,
    requestJoin,
} from '@/actions/App/Http/Controllers/TeamTransitionController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type {
    ProjectRole,
    TeamFormationState,
    TeamInvitation,
    TeamJoinRequest,
    TeamMembership,
} from '@/types/project';

type TeamCommandResponse = {
    data: Record<string, unknown>;
};

type JoinRequestPayload = {
    project_role_id: number | null;
    message: string;
};

type DecisionPayload = {
    reason: string;
};

type DecisionTarget =
    | { kind: 'accept-invitation'; id: number; person: string }
    | { kind: 'accept-join-request'; id: number; person: string }
    | { kind: 'reject-invitation'; id: number; person: string }
    | { kind: 'reject-request'; id: number; person: string }
    | { kind: 'revoke-invitation'; id: number; person: string };

type Props = {
    projectId: number;
    roles: ProjectRole[];
    team: TeamFormationState;
};

function firstError(errors: Record<string, unknown>): string | null {
    const value = Object.values(errors)[0];

    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : null;
    }

    return typeof value === 'string' ? value : null;
}

function formatDate(value: string): string {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Tanggal belum tersedia'
        : new Intl.DateTimeFormat('id-ID', {
              day: 'numeric',
              month: 'short',
              timeZone: 'UTC',
              year: 'numeric',
          }).format(date);
}

function roleLabel(role: { title: string } | null): string {
    return role?.title ?? 'Peran umum';
}

function buttonCursor(disabled: boolean): string {
    return disabled ? 'cursor-not-allowed' : 'cursor-pointer';
}

function CapacityLedger({
    capacity,
}: {
    capacity: TeamFormationState['capacity'];
}) {
    const isFull = capacity.is_full || capacity.state === 'full';
    const isClosed = capacity.state === 'closed';

    return (
        <section
            aria-labelledby="team-capacity-title"
            className="grid gap-4 border-y border-border py-5"
            data-test="team-capacity"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                    <p className="font-label text-label text-muted-foreground">
                        KAPASITAS TEAM
                    </p>
                    <h3
                        id="team-capacity-title"
                        className="text-title font-semibold"
                    >
                        {isFull
                            ? 'Kapasitas penuh untuk saat ini'
                            : isClosed
                              ? 'Project tidak sedang menerima anggota'
                              : 'Slot team yang masih tersedia'}
                    </h3>
                </div>
                <span
                    className="font-label text-label text-muted-foreground"
                    aria-label={`${capacity.occupied} dari ${capacity.total} slot terisi`}
                >
                    {capacity.occupied}/{capacity.total} TERISI
                </span>
            </div>

            <div className="grid gap-2">
                <div
                    aria-hidden="true"
                    className="grid grid-cols-5 gap-1.5 sm:grid-cols-10"
                >
                    {Array.from(
                        { length: Math.max(capacity.total, 1) },
                        (_, index) => (
                            <span
                                key={index}
                                className={
                                    index < capacity.occupied
                                        ? 'h-2 bg-primary'
                                        : 'h-2 border border-border bg-muted/60'
                                }
                            />
                        ),
                    )}
                </div>
                <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                    {isFull ? (
                        <CircleAlert
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0 text-pending"
                        />
                    ) : isClosed ? (
                        <LockKeyhole
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                    ) : (
                        <UsersRound
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0 text-primary"
                        />
                    )}
                    <span>
                        {isFull
                            ? 'Tidak ada permintaan baru yang dapat diproses sampai slot tersedia kembali.'
                            : isClosed
                              ? 'Riwayat team tetap dapat dibaca, tetapi tindakan baru tidak tersedia.'
                              : `${capacity.remaining} slot masih dapat dipertimbangkan oleh owner.`}
                    </span>
                </p>
            </div>
        </section>
    );
}

function StatusNotice({
    children,
    tone = 'info',
}: {
    children: React.ReactNode;
    tone?: 'info' | 'success' | 'warning' | 'error';
}) {
    const classes = {
        info: 'border-border bg-muted/40 text-muted-foreground',
        success:
            'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
        warning:
            'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
        error: 'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
    }[tone];

    return (
        <p
            className={`border px-3 py-3 text-sm leading-6 ${classes}`}
            role="status"
        >
            {children}
        </p>
    );
}

function InvitationRow({
    invitation,
    processing,
    onAccept,
    onReject,
}: {
    invitation: TeamInvitation;
    processing: boolean;
    onAccept: () => void;
    onReject: () => void;
}) {
    const expired = invitation.is_expired;

    return (
        <li
            className="grid gap-4 border-b border-border py-4 last:border-b-0"
            data-test={`team-invitation-${invitation.id}`}
        >
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                    <p className="flex items-start gap-2 font-semibold break-words">
                        <Send
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0 text-primary"
                        />
                        {invitation.person?.name ?? 'Pemilik project'}{' '}
                        mengundangmu
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Peran:{' '}
                        <span className="font-semibold text-foreground">
                            {roleLabel(invitation.role)}
                        </span>
                    </p>
                </div>
                <p className="font-label text-label text-muted-foreground sm:text-right">
                    {expired
                        ? 'SUDAH BERAKHIR'
                        : `BERLAKU SAMPAI ${formatDate(invitation.expires_at).toUpperCase()}`}
                </p>
            </div>

            {expired ? (
                <StatusNotice tone="warning">
                    Invitation ini sudah tidak berlaku. Kamu tidak perlu
                    mengambil tindakan lain.
                </StatusNotice>
            ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                        type="button"
                        className={buttonCursor(processing)}
                        disabled={processing}
                        onClick={onAccept}
                        data-test={`accept-invitation-${invitation.id}`}
                    >
                        {processing && <Spinner aria-hidden="true" />}
                        Terima invitation
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className={buttonCursor(processing)}
                        disabled={processing}
                        onClick={onReject}
                        data-test={`reject-invitation-${invitation.id}`}
                    >
                        Tolak dengan aman
                    </Button>
                </div>
            )}
        </li>
    );
}

function StudentTeamView({ projectId, roles, team }: Props) {
    const joinForm = useHttp<JoinRequestPayload, TeamCommandResponse>({
        project_role_id: null,
        message: '',
    });
    const decisionForm = useHttp<DecisionPayload, TeamCommandResponse>({
        reason: '',
    });
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [decision, setDecision] = useState<DecisionTarget | null>(null);

    const errors = joinForm.errors as Record<string, unknown>;
    const decisionErrors = decisionForm.errors as Record<string, unknown>;

    function refreshTeam(successMessage: string) {
        router.reload({
            only: ['team'],
            onSuccess: () => setActionMessage(successMessage),
        });
    }

    function requestError(status: number): string {
        if (status === 409) {
            return 'Kapasitas atau status project berubah. Muat ulang detail ini sebelum mencoba lagi.';
        }

        if (status === 403) {
            return 'Aksi ini tidak tersedia untuk akunmu pada project ini.';
        }

        return 'Permintaan belum tersimpan. Periksa field yang ditandai atau coba lagi.';
    }

    function submitJoin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setActionMessage(null);
        setActionError(null);

        joinForm
            .post(requestJoin(projectId).url, {
                onSuccess: () => {
                    joinForm.setData({ project_role_id: null, message: '' });
                    refreshTeam(
                        'Join request terkirim. Owner akan meninjau permintaanmu.',
                    );
                },
                onHttpException: (response: { status: number }) => {
                    setActionError(requestError(response.status));

                    return false;
                },
                onNetworkError: () => {
                    setActionError(
                        'Join request belum tersimpan. Periksa koneksi lalu coba lagi.',
                    );

                    return false;
                },
            })
            .catch(() => undefined);
    }

    function runDecision(target: DecisionTarget, reason = '') {
        setActionMessage(null);
        setActionError(null);
        decisionForm.transform((data) => ({ ...data, reason }));

        const successMessage =
            target.kind === 'reject-invitation'
                ? 'Invitation ditolak. Kamu tetap dapat menemukan peluang project lain.'
                : 'Invitation diterima. Kamu sekarang menjadi bagian dari team project ini.';
        const requestOptions = {
            onSuccess: () => {
                setDecision(null);
                decisionForm.setData({ reason: '' });
                refreshTeam(successMessage);
            },
            onHttpException: (response: { status: number }) => {
                setActionError(requestError(response.status));

                return false;
            },
            onNetworkError: () => {
                setActionError(
                    'Keputusan belum tersimpan. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
        };

        decisionForm
            .post(
                target.kind === 'reject-invitation'
                    ? rejectInvitation(target.id).url
                    : acceptInvitation(target.id).url,
                requestOptions,
            )
            .catch(() => undefined);
    }

    const currentMembership = team.current_membership;
    const hasPendingInvitation = team.pending_invitations.length > 0;

    return (
        <div className="grid gap-6" data-test="student-team-view">
            {actionMessage && (
                <StatusNotice tone="success">{actionMessage}</StatusNotice>
            )}
            {actionError && (
                <StatusNotice tone="error">{actionError}</StatusNotice>
            )}

            {hasPendingInvitation && (
                <section
                    aria-labelledby="team-invitations-title"
                    className="grid gap-3"
                    data-test="team-invitations"
                >
                    <div className="grid gap-1 border-b border-border pb-3">
                        <p className="font-label text-label text-muted-foreground">
                            INVITATION
                        </p>
                        <h3
                            id="team-invitations-title"
                            className="text-title font-semibold"
                        >
                            Peluang bergabung ke team
                        </h3>
                    </div>
                    <ul
                        className="grid"
                        aria-label="Invitation team yang menunggu keputusan"
                    >
                        {team.pending_invitations.map((invitation) => (
                            <InvitationRow
                                key={invitation.id}
                                invitation={invitation}
                                processing={decisionForm.processing}
                                onAccept={() =>
                                    runDecision({
                                        kind: 'accept-invitation',
                                        id: invitation.id,
                                        person:
                                            invitation.person?.name ??
                                            'pemilik project',
                                    })
                                }
                                onReject={() =>
                                    setDecision({
                                        kind: 'reject-invitation',
                                        id: invitation.id,
                                        person:
                                            invitation.person?.name ??
                                            'pemilik project',
                                    })
                                }
                            />
                        ))}
                    </ul>
                </section>
            )}

            {currentMembership && (
                <section
                    aria-labelledby="team-membership-title"
                    className="grid gap-3"
                    data-test="team-membership"
                >
                    <div className="grid gap-1 border-b border-border pb-3">
                        <p className="font-label text-label text-muted-foreground">
                            MEMBERSHIP
                        </p>
                        <h3
                            id="team-membership-title"
                            className="text-title font-semibold"
                        >
                            Kamu sudah bergabung
                        </h3>
                    </div>
                    <div className="grid gap-3 border-y border-border py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <p className="flex items-start gap-2 text-sm leading-6">
                            <CheckCircle2
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0 text-verified"
                            />
                            <span>
                                Peranmu:{' '}
                                <strong>
                                    {roleLabel(currentMembership.role)}
                                </strong>
                                . Membership aktif dan kapasitas project sudah
                                tersinkron.
                            </span>
                        </p>
                    </div>
                </section>
            )}

            {!currentMembership &&
                !hasPendingInvitation &&
                team.pending_join_request && (
                    <section
                        aria-labelledby="team-request-pending-title"
                        className="grid gap-3"
                        data-test="team-request-pending"
                    >
                        <div className="grid gap-1 border-b border-border pb-3">
                            <p className="font-label text-label text-muted-foreground">
                                REQUEST TERKIRIM
                            </p>
                            <h3
                                id="team-request-pending-title"
                                className="text-title font-semibold"
                            >
                                Permintaanmu sedang ditinjau
                            </h3>
                        </div>
                        <StatusNotice>
                            Owner menerima permintaanmu untuk peran{' '}
                            <strong>
                                {roleLabel(team.pending_join_request.role)}
                            </strong>
                            . Kamu akan melihat keputusan berikutnya melalui
                            notification center.
                        </StatusNotice>
                    </section>
                )}

            {!currentMembership &&
                !hasPendingInvitation &&
                !team.pending_join_request &&
                team.permissions.can_request_join && (
                    <form
                        className="grid gap-4"
                        data-test="team-join-request-form"
                        onSubmit={submitJoin}
                    >
                        <div className="grid gap-1 border-b border-border pb-3">
                            <p className="font-label text-label text-muted-foreground">
                                JOIN REQUEST
                            </p>
                            <h3 className="text-title font-semibold">
                                Ajukan diri ke project ini
                            </h3>
                            <p className="text-sm leading-6 text-muted-foreground">
                                Jelaskan kontribusi yang ingin kamu bantu. Owner
                                akan meninjau kebutuhan project dan kapasitas
                                team.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="team-request-role">
                                Peran yang diminati (opsional)
                            </Label>
                            <Select
                                value={
                                    joinForm.data.project_role_id?.toString() ??
                                    'none'
                                }
                                onValueChange={(value) =>
                                    joinForm.setData(
                                        'project_role_id',
                                        value === 'none' ? null : Number(value),
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="team-request-role"
                                    className="w-full cursor-pointer"
                                    aria-invalid={Boolean(
                                        errors.project_role_id,
                                    )}
                                >
                                    <SelectValue placeholder="Pilih peran" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Peran umum
                                    </SelectItem>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={String(role.id)}
                                        >
                                            {role.title} · {role.capacity} slot
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {firstError({
                                project_role_id: errors.project_role_id,
                            }) && (
                                <p
                                    className="text-sm text-destructive"
                                    role="alert"
                                >
                                    {firstError({
                                        project_role_id: errors.project_role_id,
                                    })}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="team-request-message">
                                Pesan untuk owner (opsional)
                            </Label>
                            <textarea
                                id="team-request-message"
                                value={joinForm.data.message}
                                onChange={(event) =>
                                    joinForm.setData(
                                        'message',
                                        event.target.value,
                                    )
                                }
                                maxLength={1000}
                                rows={4}
                                placeholder="Contoh: Saya dapat membantu menyusun API dan dokumentasi teknis."
                                className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base transition-[color,background-color,border-color] duration-fast outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 md:text-sm"
                                aria-invalid={Boolean(errors.message)}
                            />
                            <p className="text-xs leading-5 text-muted-foreground">
                                Hindari informasi pribadi yang tidak diperlukan
                                untuk menilai kontribusi.
                            </p>
                            {firstError({ message: errors.message }) && (
                                <p
                                    className="text-sm text-destructive"
                                    role="alert"
                                >
                                    {firstError({ message: errors.message })}
                                </p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className={
                                'w-full ' +
                                buttonCursor(joinForm.processing) +
                                ' sm:w-fit'
                            }
                            disabled={joinForm.processing}
                            data-test="submit-team-join-request"
                        >
                            {joinForm.processing && (
                                <Spinner aria-hidden="true" />
                            )}
                            Kirim join request
                        </Button>
                    </form>
                )}

            {!currentMembership &&
                !hasPendingInvitation &&
                !team.pending_join_request &&
                !team.permissions.can_request_join && (
                    <StatusNotice
                        tone={team.capacity.is_full ? 'warning' : 'info'}
                    >
                        {team.capacity.is_full
                            ? 'Kapasitas team sedang penuh. Kamu dapat kembali memeriksa project ini setelah ada slot yang tersedia.'
                            : 'Mode baca. Project ini belum dapat menerima join request dari akunmu.'}
                    </StatusNotice>
                )}

            {(Object.keys(decisionErrors).length > 0 ||
                decisionForm.hasErrors) && (
                <p className="text-sm text-destructive" role="alert">
                    {firstError(decisionErrors) ??
                        'Keputusan belum dapat diproses.'}
                </p>
            )}

            <Dialog
                open={decision?.kind === 'reject-invitation'}
                onOpenChange={(open) =>
                    !open && !decisionForm.processing && setDecision(null)
                }
            >
                <DialogContent>
                    <DialogTitle>
                        Tolak invitation dari {decision?.person}?
                    </DialogTitle>
                    <DialogDescription>
                        Menolak invitation tidak menghapus profil atau project.
                        Alasan bersifat opsional dan sebaiknya hanya berisi
                        konteks kolaborasi.
                    </DialogDescription>
                    <div className="grid gap-2">
                        <Label htmlFor="student-invitation-reason">
                            Catatan opsional
                        </Label>
                        <textarea
                            id="student-invitation-reason"
                            value={decisionForm.data.reason}
                            onChange={(event) =>
                                decisionForm.setData(
                                    'reason',
                                    event.target.value,
                                )
                            }
                            maxLength={1000}
                            rows={3}
                            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                            placeholder="Contoh: Saya sedang memilih scope project lain."
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className={buttonCursor(
                                    decisionForm.processing,
                                )}
                                disabled={decisionForm.processing}
                            >
                                Kembali
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            className={buttonCursor(decisionForm.processing)}
                            disabled={decisionForm.processing}
                            onClick={() =>
                                decision &&
                                runDecision(decision, decisionForm.data.reason)
                            }
                            data-test="confirm-reject-invitation"
                        >
                            {decisionForm.processing && (
                                <Spinner aria-hidden="true" />
                            )}
                            Tolak invitation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function RequestRow({
    request,
    processing,
    onAccept,
    onReject,
}: {
    request: TeamJoinRequest;
    processing: boolean;
    onAccept: () => void;
    onReject: () => void;
}) {
    return (
        <li
            className="grid gap-3 border-b border-border py-4 last:border-b-0"
            data-test={`team-join-request-${request.id}`}
        >
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                    <p className="flex items-start gap-2 font-semibold break-words">
                        <Inbox
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0 text-primary"
                        />
                        {request.requester?.name ?? 'Mahasiswa'} meminta
                        bergabung
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Peran:{' '}
                        <span className="font-semibold text-foreground">
                            {roleLabel(request.role)}
                        </span>
                    </p>
                </div>
                <p className="font-label text-label text-muted-foreground sm:text-right">
                    {formatDate(request.requested_at)}
                </p>
            </div>
            {request.message && (
                <p className="border-l border-border pl-3 text-sm leading-6 text-muted-foreground">
                    “{request.message}”
                </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                    type="button"
                    className={buttonCursor(processing)}
                    disabled={processing}
                    onClick={onAccept}
                    data-test={`accept-join-request-${request.id}`}
                >
                    {processing && <Spinner aria-hidden="true" />}
                    Terima request
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className={buttonCursor(processing)}
                    disabled={processing}
                    onClick={onReject}
                    data-test={`reject-join-request-${request.id}`}
                >
                    Tolak dengan aman
                </Button>
            </div>
        </li>
    );
}

function OwnerTeamView({ team }: { team: TeamFormationState }) {
    const decisionForm = useHttp<DecisionPayload, TeamCommandResponse>({
        reason: '',
    });
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [decision, setDecision] = useState<DecisionTarget | null>(null);
    const processing = decisionForm.processing;

    function refreshTeam(successMessage: string) {
        router.reload({
            only: ['team'],
            onSuccess: () => setActionMessage(successMessage),
        });
    }

    function runDecision(target: DecisionTarget, reason = '') {
        setActionMessage(null);
        setActionError(null);
        decisionForm.transform((data) => ({ ...data, reason }));

        const successMessage =
            target.kind === 'accept-join-request'
                ? 'Join request diterima. Membership baru sudah tercatat.'
                : target.kind === 'reject-request'
                  ? 'Join request ditolak dengan catatan yang aman.'
                  : 'Invitation dibatalkan dan tidak lagi berlaku.';
        const requestOptions = {
            onSuccess: () => {
                setDecision(null);
                decisionForm.setData({ reason: '' });
                refreshTeam(successMessage);
            },
            onHttpException: (response: { status: number }) => {
                setActionError(
                    response.status === 409
                        ? 'Status team berubah. Muat ulang halaman sebelum mencoba lagi.'
                        : 'Perubahan team belum dapat diproses pada project ini.',
                );

                return false;
            },
            onNetworkError: () => {
                setActionError(
                    'Perubahan team belum tersimpan. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
        };

        decisionForm
            .post(
                target.kind === 'reject-request'
                    ? rejectJoinRequest(target.id).url
                    : target.kind === 'revoke-invitation'
                      ? revokeInvitation(target.id).url
                      : acceptJoinRequest(target.id).url,
                requestOptions,
            )
            .catch(() => undefined);
    }

    const decisionErrors = decisionForm.errors as Record<string, unknown>;

    return (
        <div className="grid gap-6" data-test="owner-team-view">
            {actionMessage && (
                <StatusNotice tone="success">{actionMessage}</StatusNotice>
            )}
            {actionError && (
                <StatusNotice tone="error">{actionError}</StatusNotice>
            )}

            <section
                aria-labelledby="team-members-title"
                className="grid gap-3"
                data-test="team-members"
            >
                <div className="grid gap-1 border-b border-border pb-3">
                    <p className="font-label text-label text-muted-foreground">
                        ACTIVE TEAM
                    </p>
                    <h3
                        id="team-members-title"
                        className="text-title font-semibold"
                    >
                        Anggota yang sudah bergabung
                    </h3>
                </div>
                {team.active_members.length === 0 ? (
                    <StatusNotice>
                        Belum ada anggota aktif selain owner. Request yang masuk
                        akan muncul pada queue di bawah.
                    </StatusNotice>
                ) : (
                    <ul
                        className="grid divide-y divide-border"
                        aria-label="Anggota aktif team"
                    >
                        {team.active_members.map(
                            (membership: TeamMembership) => (
                                <li
                                    key={membership.id}
                                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                                >
                                    <p className="flex min-w-0 items-center gap-2 text-sm font-semibold break-words">
                                        <UserRound
                                            aria-hidden="true"
                                            className="size-4 shrink-0 text-primary"
                                        />
                                        {membership.user?.name ??
                                            'Anggota team'}
                                    </p>
                                    <span className="font-label text-label text-muted-foreground">
                                        {roleLabel(membership.role)}
                                    </span>
                                </li>
                            ),
                        )}
                    </ul>
                )}
            </section>

            <section
                aria-labelledby="team-request-queue-title"
                className="grid gap-3"
                data-test="team-request-queue"
            >
                <div className="grid gap-1 border-b border-border pb-3">
                    <p className="font-label text-label text-muted-foreground">
                        REQUEST QUEUE
                    </p>
                    <h3
                        id="team-request-queue-title"
                        className="text-title font-semibold"
                    >
                        Permintaan yang perlu ditinjau
                    </h3>
                </div>
                {team.join_requests.length === 0 ? (
                    <StatusNotice>
                        Belum ada join request yang menunggu keputusan.
                    </StatusNotice>
                ) : (
                    <ul
                        className="grid"
                        aria-label="Join request yang menunggu keputusan"
                    >
                        {team.join_requests.map((request) => (
                            <RequestRow
                                key={request.id}
                                request={request}
                                processing={processing}
                                onAccept={() =>
                                    runDecision({
                                        kind: 'accept-join-request',
                                        id: request.id,
                                        person:
                                            request.requester?.name ??
                                            'mahasiswa',
                                    })
                                }
                                onReject={() =>
                                    setDecision({
                                        kind: 'reject-request',
                                        id: request.id,
                                        person:
                                            request.requester?.name ??
                                            'mahasiswa',
                                    })
                                }
                            />
                        ))}
                    </ul>
                )}
            </section>

            <section
                aria-labelledby="team-sent-invitations-title"
                className="grid gap-3"
                data-test="team-sent-invitations"
            >
                <div className="grid gap-1 border-b border-border pb-3">
                    <p className="font-label text-label text-muted-foreground">
                        SENT INVITATIONS
                    </p>
                    <h3
                        id="team-sent-invitations-title"
                        className="text-title font-semibold"
                    >
                        Invitation yang masih aktif
                    </h3>
                </div>
                {team.sent_invitations.length === 0 ? (
                    <StatusNotice>
                        Belum ada invitation aktif yang perlu dikelola.
                    </StatusNotice>
                ) : (
                    <ul
                        className="grid divide-y divide-border"
                        aria-label="Invitation team yang dikirim owner"
                    >
                        {team.sent_invitations.map((invitation) => (
                            <li
                                key={invitation.id}
                                className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                                data-test={`team-sent-invitation-${invitation.id}`}
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold break-words">
                                        {invitation.person?.name ?? 'Mahasiswa'}
                                    </p>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        {roleLabel(invitation.role)} · berlaku
                                        sampai{' '}
                                        {formatDate(invitation.expires_at)}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={buttonCursor(processing)}
                                    disabled={processing}
                                    onClick={() =>
                                        setDecision({
                                            kind: 'revoke-invitation',
                                            id: invitation.id,
                                            person:
                                                invitation.person?.name ??
                                                'mahasiswa',
                                        })
                                    }
                                    data-test={`revoke-invitation-${invitation.id}`}
                                >
                                    Batalkan invitation
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <p className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-verified"
                />
                Data queue hanya menampilkan mahasiswa pada konteks kampus dan
                project yang sama. Sinyal inclusion atau alasan tersembunyi
                tidak ditampilkan.
            </p>

            {(Object.keys(decisionErrors).length > 0 ||
                decisionForm.hasErrors) && (
                <p className="text-sm text-destructive" role="alert">
                    {firstError(decisionErrors) ??
                        'Keputusan belum dapat diproses.'}
                </p>
            )}

            <Dialog
                open={decision !== null}
                onOpenChange={(open) =>
                    !open && !decisionForm.processing && setDecision(null)
                }
            >
                <DialogContent>
                    <DialogTitle>
                        {decision?.kind === 'revoke-invitation'
                            ? `Batalkan invitation untuk ${decision?.person}?`
                            : `Tolak request dari ${decision?.person}?`}
                    </DialogTitle>
                    <DialogDescription>
                        {decision?.kind === 'revoke-invitation'
                            ? 'Penerima akan melihat bahwa invitation ini tidak lagi berlaku.'
                            : 'Gunakan catatan yang terkait kebutuhan project. Hindari penilaian pribadi atau informasi yang tidak diperlukan.'}
                    </DialogDescription>
                    <div className="grid gap-2">
                        <Label htmlFor="owner-decision-reason">
                            Alasan atau catatan (opsional)
                        </Label>
                        <textarea
                            id="owner-decision-reason"
                            value={decisionForm.data.reason}
                            onChange={(event) =>
                                decisionForm.setData(
                                    'reason',
                                    event.target.value,
                                )
                            }
                            maxLength={1000}
                            rows={3}
                            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                            placeholder="Contoh: Kebutuhan role berubah."
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className={buttonCursor(
                                    decisionForm.processing,
                                )}
                                disabled={decisionForm.processing}
                            >
                                Kembali
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            className={buttonCursor(decisionForm.processing)}
                            disabled={decisionForm.processing}
                            onClick={() =>
                                decision &&
                                runDecision(decision, decisionForm.data.reason)
                            }
                            data-test="confirm-owner-team-decision"
                        >
                            {decisionForm.processing && (
                                <Spinner aria-hidden="true" />
                            )}
                            {decision?.kind === 'revoke-invitation'
                                ? 'Batalkan invitation'
                                : 'Tolak request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function TeamFormationPanel({ projectId, roles, team }: Props) {
    const isOwner =
        team.permissions.can_manage_requests ||
        team.permissions.can_manage_invitations;
    const [isTeamRefreshing, setIsTeamRefreshing] = useState(false);

    useEffect(() => {
        const isTeamOnlyReload = (visit: { only: string[] }): boolean =>
            visit.only.length === 1 && visit.only[0] === 'team';
        const removeStartListener = router.on('start', (event) => {
            if (isTeamOnlyReload(event.detail.visit)) {
                setIsTeamRefreshing(true);
            }
        });
        const removeFinishListener = router.on('finish', (event) => {
            if (isTeamOnlyReload(event.detail.visit)) {
                setIsTeamRefreshing(false);
            }
        });

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    return (
        <section
            aria-labelledby="team-formation-title"
            aria-busy={isTeamRefreshing}
            className="grid gap-6 border-t border-border pt-6"
            data-test="team-formation-panel"
        >
            {isTeamRefreshing && (
                <p
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                    <Spinner aria-hidden="true" />
                    Memuat status team terbaru...
                </p>
            )}
            <div className="grid gap-2">
                <p className="font-label text-label text-primary">
                    TEAM FORMATION
                </p>
                <h2
                    id="team-formation-title"
                    className="text-title font-semibold"
                >
                    Bentuk team dengan keputusan yang dapat dipulihkan
                </h2>
                <p className="max-w-[70ch] text-sm leading-6 text-muted-foreground">
                    Capacity, invitation, dan join request ditampilkan sesuai
                    permission project. Setiap keputusan disimpan melalui
                    transition atomik.
                </p>
            </div>
            <CapacityLedger capacity={team.capacity} />
            {isOwner ? (
                <OwnerTeamView team={team} />
            ) : (
                <StudentTeamView
                    projectId={projectId}
                    roles={roles}
                    team={team}
                />
            )}
        </section>
    );
}
