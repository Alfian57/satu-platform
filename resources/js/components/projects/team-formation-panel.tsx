import { Link, router, useHttp } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleAlert,
    Inbox,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import { useRef, useState } from 'react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
import ProjectWorkspaceController from '@/actions/App/Http/Controllers/ProjectWorkspaceController';
import {
    acceptInvitation,
    acceptJoinRequest,
    rejectInvitation,
    rejectJoinRequest,
    requestJoin,
    revokeInvitation,
    withdrawJoinRequest,
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
import { beginnerLabel, capacityLabel } from '@/lib/project-opportunities';
import { show as portfolioShow } from '@/routes/portfolio';
import { index as projectsIndex } from '@/routes/projects';
import type {
    ProjectRole,
    TeamFormationState,
    TeamJoinRequest,
} from '@/types/project';

type Props = {
    projectId: number;
    roles: ProjectRole[];
    team: TeamFormationState;
    canWorkspace?: boolean;
    onAccessDenied?: () => void;
};
type CommandResponse = { data: Record<string, unknown> };
type Application = {
    project_role_id: number | null;
    interest: string;
    skills: string;
    availability: string;
};
type Decision = {
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
const emptyApplication: Application = {
    project_role_id: null,
    interest: '',
    skills: '',
    availability: '',
};
const reloadKeys = [
    'team',
    'project',
    'can_edit',
    'can_transition',
    'can_workspace',
];
const textAreaClass =
    'min-h-20 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50';

function firstError(errors: Record<string, unknown>): string | null {
    const error = Object.values(errors)[0];

    return typeof error === 'string'
        ? error
        : Array.isArray(error) && typeof error[0] === 'string'
          ? error[0]
          : null;
}
function formatDate(value: string): string {
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
function focusTeam() {
    document.getElementById('team-formation-title')?.focus();
}
function Section({
    title,
    id,
    children,
}: {
    title: string;
    id: string;
    children: React.ReactNode;
}) {
    return (
        <section
            aria-labelledby={`${id}-title`}
            data-test={id}
            className="grid min-w-0 gap-4 rounded-2xl border border-border bg-background/65 p-4 sm:p-5"
        >
            <h3
                id={`${id}-title`}
                className="border-b border-border pb-3 text-title font-semibold"
            >
                {title}
            </h3>
            {children}
        </section>
    );
}
function Criteria({ role }: { role?: TeamJoinRequest['role'] }) {
    return (
        <div className="grid min-w-0 gap-1 rounded-xl border border-primary/15 bg-accent/60 p-3 text-sm leading-6 wrap-anywhere">
            <p className="font-semibold">{role?.title ?? 'Peran umum'}</p>
            <p className="text-muted-foreground">
                {role?.selection_criteria ??
                    'Kriteria belum dinyatakan. Gunakan kebutuhan proyek yang terbaca, bukan popularitas atau penilaian kepribadian.'}
            </p>
        </div>
    );
}

export function TeamFormationPanel({
    projectId,
    roles,
    team,
    canWorkspace = false,
    onAccessDenied,
}: Props) {
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
    const trigger = useRef<HTMLElement | null>(null);
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

    function announceError(text: string, uncertain = false) {
        setError(text);

        if (uncertain) {
            needsCheck.current = true;
            setMustCheck(true);
        }

        requestAnimationFrame(() => feedbackRef.current?.focus());
    }
    function httpFailure(response: { status: number }) {
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
    function reload(successMessage?: string, page?: number) {
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
    function finishCommand() {
        if (!refreshLock.current) {
            commandLock.current = needsCheck.current;
        }
    }
    function openDecision(target: Decision) {
        if (blocked || commandLock.current) {
            return;
        }

        trigger.current =
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
    function submitJoin(event: React.FormEvent<HTMLFormElement>) {
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
    function submitDecision() {
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
    const feedback = (error || validation || mustCheck) && (
        <div
            ref={feedbackRef}
            tabIndex={-1}
            role="alert"
            className="grid gap-3 rounded-xl border border-correction/40 bg-correction-subtle p-3 text-sm leading-6 wrap-anywhere focus-visible:outline-2 focus-visible:outline-ring"
        >
            <p>{error ?? validation}</p>
            {mustCheck && (
                <Button
                    type="button"
                    variant="outline"
                    disabled={syncing}
                    onClick={() => reload()}
                    className="min-h-11 w-full whitespace-normal"
                >
                    {syncing && <Spinner aria-hidden="true" />}Periksa status
                    terbaru
                </Button>
            )}
        </div>
    );

    return (
        <section
            aria-labelledby="team-formation-title"
            aria-busy={busy}
            className="grid min-w-0 gap-6 border-t border-border px-1 pt-6"
            data-test="team-formation-panel"
        >
            <div className="grid gap-2">
                <p className="font-label text-label text-primary">Tim proyek</p>
                <h2
                    id="team-formation-title"
                    tabIndex={-1}
                    className="text-title font-semibold focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
                >
                    Temukan tempatmu dalam tim
                </h2>
                <p className="max-w-[70ch] text-sm leading-6 text-muted-foreground">
                    Pahami peran, ajukan minat, lalu baca keputusan. Pengajuan
                    bukan jaminan penerimaan dan tidak memesan tempat.
                </p>
            </div>
            {!decision && feedback}
            {message && (
                <p
                    role="status"
                    className="rounded-xl border border-verified/40 bg-verified-subtle p-3 text-sm leading-6"
                >
                    {message}
                </p>
            )}
            {syncing && (
                <p
                    role="status"
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                    <Spinner aria-hidden="true" />
                    Memuat status tim terbaru...
                </p>
            )}
            <section
                aria-labelledby="team-capacity-title"
                className="grid gap-3 rounded-3xl border border-border bg-linear-to-br from-accent/70 to-background p-5 sm:p-6"
                data-test="team-capacity"
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3
                        id="team-capacity-title"
                        className="text-title font-semibold"
                    >
                        {team.capacity.is_full
                            ? 'Kapasitas penuh untuk saat ini'
                            : team.capacity.state === 'closed'
                              ? 'Proyek tidak sedang menerima anggota'
                              : 'Tempat tim yang masih tersedia'}
                    </h3>
                    <span className="font-label text-label text-muted-foreground">
                        {team.capacity.occupied}/{team.capacity.total} TERISI
                    </span>
                </div>
                <div
                    aria-hidden="true"
                    className="h-2.5 overflow-hidden rounded-full bg-muted"
                >
                    <div
                        className="h-full rounded-full bg-primary"
                        style={{
                            width: `${Math.min(100, (team.capacity.occupied / Math.max(1, team.capacity.total)) * 100)}%`,
                        }}
                    />
                </div>
                <p className="flex gap-2 text-sm leading-6 text-muted-foreground">
                    <UsersRound
                        className="mt-1 size-4 shrink-0"
                        aria-hidden="true"
                    />
                    <span>
                        {team.capacity.remaining} tempat tersisa secara fisik.{' '}
                        {team.capacity.state === 'open'
                            ? 'Pemilik mempertimbangkan kebutuhan dan kapasitas peran sebelum menerima.'
                            : 'Pengajuan baru ditutup. Pengajuan menunggu masih dapat ditarik atau ditolak.'}
                    </span>
                </p>
            </section>
            {team.current_membership && (
                <Section title="Kamu sudah bergabung" id="team-membership">
                    <p className="flex gap-2 text-sm leading-6">
                        <CheckCircle2
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0 text-verified"
                        />
                        <span>
                            Peranmu:{' '}
                            <strong>
                                {team.current_membership.role?.title ??
                                    'Peran umum'}
                            </strong>
                            . Keanggotaan aktif tercatat.
                        </span>
                    </p>
                    {canWorkspace && (
                        <Button
                            asChild
                            className="min-h-11 w-full whitespace-normal sm:w-fit"
                        >
                            <Link
                                href={ProjectWorkspaceController.show(
                                    projectId,
                                )}
                            >
                                Buka ruang kerja
                            </Link>
                        </Button>
                    )}
                </Section>
            )}
            {!owner && (
                <div
                    className="grid min-w-0 gap-6"
                    data-test="student-team-view"
                >
                    {team.pending_invitations.length > 0 && (
                        <Section
                            title="Peluang bergabung ke tim"
                            id="team-invitations"
                        >
                            <ul
                                className="grid min-w-0 gap-3"
                                aria-label="Undangan tim yang menunggu keputusan"
                            >
                                {team.pending_invitations.map((invitation) => (
                                    <li
                                        key={invitation.id}
                                        className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-4"
                                        data-test={`team-invitation-${invitation.id}`}
                                    >
                                        <p className="font-semibold wrap-anywhere">
                                            {invitation.person?.name ??
                                                'Pemilik proyek'}{' '}
                                            mengundangmu
                                        </p>
                                        <p className="text-sm leading-6 text-muted-foreground">
                                            {invitation.role?.title ??
                                                'Peran umum'}
                                            . Berlaku sampai{' '}
                                            {formatDate(invitation.expires_at)}.
                                        </p>
                                        {invitation.is_expired ? (
                                            <p
                                                role="status"
                                                className="text-sm"
                                            >
                                                Undangan sudah berakhir.
                                                Mintalah undangan baru bila
                                                masih ingin bergabung.
                                            </p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    disabled={blocked}
                                                    onClick={() =>
                                                        openDecision({
                                                            kind: 'accept-invitation',
                                                            id: invitation.id,
                                                            person:
                                                                invitation
                                                                    .person
                                                                    ?.name ??
                                                                'pemilik proyek',
                                                        })
                                                    }
                                                    data-test={`accept-invitation-${invitation.id}`}
                                                    className="min-h-11"
                                                >
                                                    Terima undangan
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={blocked}
                                                    onClick={() =>
                                                        openDecision({
                                                            kind: 'reject-invitation',
                                                            id: invitation.id,
                                                            person:
                                                                invitation
                                                                    .person
                                                                    ?.name ??
                                                                'pemilik proyek',
                                                        })
                                                    }
                                                    data-test={`reject-invitation-${invitation.id}`}
                                                    className="min-h-11"
                                                >
                                                    Tolak undangan
                                                </Button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}
                    {team.pending_join_request && (
                        <Section
                            title="Pengajuanmu sedang ditinjau"
                            id="team-request-pending"
                        >
                            <p className="text-sm leading-6">
                                Pemilik menerima pengajuan untuk{' '}
                                <strong>
                                    {team.pending_join_request.role?.title ??
                                        'peran umum'}
                                </strong>
                                . Belum menjadi anggota melalui pengajuan ini.
                                Periksa keputusan di sini atau pusat notifikasi.
                            </p>
                            <p className="text-sm leading-6 wrap-anywhere whitespace-pre-line text-muted-foreground">
                                {team.pending_join_request.message}
                            </p>
                            {team.permissions.can_withdraw && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={blocked}
                                    className="min-h-11 w-full sm:w-fit"
                                    onClick={() =>
                                        openDecision({
                                            kind: 'withdraw-request',
                                            id: team.pending_join_request!.id,
                                            person: 'dirimu',
                                            revision:
                                                team.pending_join_request!
                                                    .revision,
                                        })
                                    }
                                >
                                    Tarik pengajuan
                                </Button>
                            )}
                        </Section>
                    )}
                    {!team.current_membership &&
                        team.pending_invitations.length === 0 &&
                        !team.pending_join_request &&
                        (team.permissions.can_request_join ? (
                            <form
                                id="team-join-request-form"
                                tabIndex={-1}
                                onSubmit={submitJoin}
                                data-test="team-join-request-form"
                                className="grid min-w-0 scroll-mt-24 gap-4 rounded-2xl border border-primary/20 bg-background/65 p-4 sm:p-5"
                            >
                                <div className="grid gap-2 border-b border-border pb-3">
                                    <h3 className="text-title font-semibold">
                                        Ajukan minat, tidak perlu promosi diri
                                    </h3>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Jawaban singkat cukup. Kamu tidak wajib
                                        memiliki karya atau riwayat kolaborasi.
                                        Ringkasan ini hanya dibaca olehmu dan
                                        pemilik proyek, bukan anggota lain.
                                        Bukti privat profil tidak ikut
                                        dibagikan.
                                    </p>
                                </div>
                                <fieldset
                                    disabled={blocked}
                                    className="grid min-w-0 gap-4 disabled:opacity-70"
                                >
                                    <div className="grid gap-2">
                                        <Label htmlFor="team-request-role">
                                            Peran yang diminati (opsional)
                                        </Label>
                                        <Select
                                            value={
                                                joinForm.data.project_role_id?.toString() ??
                                                'none'
                                            }
                                            disabled={blocked}
                                            onValueChange={(value) =>
                                                joinForm.setData(
                                                    'project_role_id',
                                                    value === 'none'
                                                        ? null
                                                        : Number(value),
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="team-request-role"
                                                aria-invalid={Boolean(
                                                    joinErrors.project_role_id,
                                                )}
                                                className="min-h-11 w-full min-w-0 cursor-pointer py-3 text-left data-[size=default]:h-auto [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:wrap-anywhere [&_[data-slot=select-value]]:whitespace-normal"
                                            >
                                                <SelectValue placeholder="Pilih peran" />
                                            </SelectTrigger>
                                            <SelectContent
                                                avoidCollisions
                                                className="w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]"
                                            >
                                                <SelectItem
                                                    value="none"
                                                    className="min-h-11 cursor-pointer"
                                                >
                                                    Peran umum
                                                </SelectItem>
                                                {roles.map((role) => (
                                                    <SelectItem
                                                        key={role.id}
                                                        value={String(role.id)}
                                                        disabled={
                                                            role.capacity_stats
                                                                ?.accepting ===
                                                            false
                                                        }
                                                        className="min-h-11 cursor-pointer [&_span]:wrap-anywhere [&_span]:whitespace-normal"
                                                    >
                                                        {role.title}.{' '}
                                                        {beginnerLabel(
                                                            role.accepts_beginners,
                                                        )}
                                                        .{' '}
                                                        {capacityLabel(
                                                            role.capacity_stats,
                                                            role.capacity,
                                                        )}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {Boolean(
                                            joinErrors.project_role_id,
                                        ) && (
                                            <p className="text-sm text-destructive">
                                                {firstError({
                                                    role: joinErrors.project_role_id,
                                                })}
                                            </p>
                                        )}
                                    </div>
                                    {selectedRole && (
                                        <Criteria role={selectedRole} />
                                    )}
                                    {(
                                        [
                                            [
                                                'interest',
                                                'Minat yang ingin kamu bantu',
                                                200,
                                                'Contoh: Membantu merancang tampilan proyek kampus.',
                                            ],
                                            [
                                                'skills',
                                                'Kemampuan relevan atau hal yang ingin dipelajari',
                                                350,
                                                'Contoh: Dasar Figma. Ingin belajar riset kebutuhan bersama tim.',
                                            ],
                                            [
                                                'availability',
                                                'Ketersediaan singkat',
                                                250,
                                                'Contoh: Selasa dan Kamis sore, sekitar 3 jam per minggu.',
                                            ],
                                        ] as const
                                    ).map(
                                        ([
                                            key,
                                            label,
                                            maxLength,
                                            placeholder,
                                        ]) => (
                                            <div
                                                key={key}
                                                className="grid gap-2"
                                            >
                                                <Label
                                                    htmlFor={`team-request-${key}`}
                                                >
                                                    {label}
                                                </Label>
                                                <textarea
                                                    aria-required="true"
                                                    id={`team-request-${key}`}
                                                    value={joinForm.data[key]}
                                                    onChange={(event) =>
                                                        joinForm.setData(
                                                            key,
                                                            event.target.value,
                                                        )
                                                    }
                                                    maxLength={maxLength}
                                                    rows={2}
                                                    placeholder={placeholder}
                                                    className={textAreaClass}
                                                    aria-invalid={Boolean(
                                                        joinErrors[key],
                                                    )}
                                                    aria-describedby={`team-request-${key}-hint`}
                                                />
                                                <p
                                                    id={`team-request-${key}-hint`}
                                                    className="text-xs leading-5 text-muted-foreground"
                                                >
                                                    {firstError({
                                                        [key]: joinErrors[key],
                                                    }) ??
                                                        `Maksimal ${maxLength} karakter. Hindari kontak dan data pribadi yang tidak diperlukan.`}
                                                </p>
                                            </div>
                                        ),
                                    )}
                                </fieldset>
                                <Button
                                    type="submit"
                                    disabled={blocked}
                                    data-test="submit-team-join-request"
                                    className="min-h-11 w-full whitespace-normal sm:w-fit"
                                >
                                    {joinForm.processing && (
                                        <Spinner aria-hidden="true" />
                                    )}
                                    Kirim permintaan bergabung
                                </Button>
                            </form>
                        ) : (
                            <p
                                role="status"
                                className="flex gap-2 text-sm leading-6 text-muted-foreground"
                            >
                                <CircleAlert
                                    aria-hidden="true"
                                    className="mt-1 size-4 shrink-0"
                                />
                                <span>
                                    {team.capacity.is_full
                                        ? 'Kapasitas tim sedang penuh. Periksa kembali setelah tersedia tempat atau cari peluang lain.'
                                        : 'Proyek tidak dapat menerima pengajuan dari akunmu saat ini.'}
                                </span>
                            </p>
                        ))}
                </div>
            )}
            {owner && (
                <div className="grid min-w-0 gap-6" data-test="owner-team-view">
                    <Section
                        title="Anggota yang sudah bergabung"
                        id="team-members"
                    >
                        {team.active_members.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada anggota aktif tercatat. Pengajuan
                                belum mengisi kapasitas tim.
                            </p>
                        ) : (
                            <ul
                                aria-label="Anggota aktif tim"
                                className="grid gap-3"
                            >
                                {team.active_members.map((membership) => (
                                    <li
                                        key={membership.id}
                                        className="flex min-w-0 flex-wrap justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm wrap-anywhere"
                                    >
                                        <strong>
                                            {membership.user?.name ??
                                                'Anggota tim'}
                                        </strong>
                                        <span className="text-muted-foreground">
                                            {membership.role?.title ??
                                                'Peran umum'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Section>
                    <Section
                        title="Pengajuan yang perlu ditinjau"
                        id="team-request-queue"
                    >
                        <p className="text-sm leading-6 text-muted-foreground">
                            Pertimbangkan kebutuhan peran, kemampuan yang
                            dinyatakan, dan ketersediaan. Tidak ada skor
                            popularitas atau syarat karya terdahulu.
                        </p>
                        {team.join_requests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada pengajuan bergabung yang menunggu
                                keputusan.
                            </p>
                        ) : (
                            <ul
                                aria-label="Pengajuan bergabung yang menunggu keputusan"
                                className="grid min-w-0 gap-3"
                            >
                                {team.join_requests.map((request) => (
                                    <li
                                        key={request.id}
                                        data-test={`team-join-request-${request.id}`}
                                        className="grid min-w-0 gap-3 border-b border-border py-4 last:border-b-0"
                                    >
                                        <div className="flex flex-wrap justify-between gap-2">
                                            <p className="flex gap-2 font-semibold wrap-anywhere">
                                                <Inbox
                                                    aria-hidden="true"
                                                    className="mt-1 size-4 shrink-0 text-primary"
                                                />
                                                {request.requester?.name ??
                                                    'Mahasiswa'}{' '}
                                                meminta bergabung
                                            </p>
                                            <span className="text-xs leading-5 text-muted-foreground">
                                                {formatDate(
                                                    request.requested_at,
                                                )}
                                            </span>
                                        </div>
                                        <Criteria role={request.role} />
                                        <p className="text-sm leading-6 wrap-anywhere whitespace-pre-line text-muted-foreground">
                                            {request.message ??
                                                'Pengajuan lama belum menyertakan ringkasan kemampuan dan ketersediaan.'}
                                        </p>
                                        <div className="grid gap-2 rounded-xl border border-border bg-card p-3">
                                            <p className="text-sm font-semibold">
                                                Karya yang diizinkan untuk
                                                dibaca
                                            </p>
                                            {!request.shared_work?.length ? (
                                                <p className="text-xs leading-5 text-muted-foreground">
                                                    Tidak ada karya yang
                                                    dibagikan di sini. Bukan
                                                    tanda kurang kemampuan.
                                                </p>
                                            ) : (
                                                <ul className="grid gap-3">
                                                    {request.shared_work.map(
                                                        (work) => (
                                                            <li
                                                                key={work.id}
                                                                className="grid min-w-0 gap-1 text-sm wrap-anywhere"
                                                            >
                                                                <Link
                                                                    href={portfolioShow(
                                                                        work.id,
                                                                    )}
                                                                    className="w-fit cursor-pointer rounded-md font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                                                                >
                                                                    {work.title}
                                                                </Link>
                                                                <p className="line-clamp-3 leading-6 text-muted-foreground">
                                                                    {
                                                                        work.summary
                                                                    }
                                                                </p>
                                                                <span className="text-xs leading-5 text-muted-foreground">
                                                                    {
                                                                        work.verification_label
                                                                    }
                                                                    . Pengakuan
                                                                    kontribusi
                                                                    ini, bukan
                                                                    verifikasi
                                                                    seluruh
                                                                    kemampuan.
                                                                </span>
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                            <Button
                                                type="button"
                                                disabled={
                                                    blocked ||
                                                    request.can_accept ===
                                                        false ||
                                                    team.capacity.state !==
                                                        'open'
                                                }
                                                className="min-h-11 whitespace-normal"
                                                data-test={`accept-join-request-${request.id}`}
                                                onClick={() =>
                                                    openDecision({
                                                        kind: 'accept-request',
                                                        id: request.id,
                                                        person:
                                                            request.requester
                                                                ?.name ??
                                                            'mahasiswa',
                                                        revision:
                                                            request.revision,
                                                        role: request.role,
                                                    })
                                                }
                                            >
                                                Terima pengajuan
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={blocked}
                                                className="min-h-11 whitespace-normal"
                                                data-test={`reject-join-request-${request.id}`}
                                                onClick={() =>
                                                    openDecision({
                                                        kind: 'reject-request',
                                                        id: request.id,
                                                        person:
                                                            request.requester
                                                                ?.name ??
                                                            'mahasiswa',
                                                        revision:
                                                            request.revision,
                                                        role: request.role,
                                                    })
                                                }
                                            >
                                                Tolak pengajuan
                                            </Button>
                                        </div>
                                        {(request.can_accept === false ||
                                            team.capacity.state !== 'open') && (
                                            <p className="text-xs leading-5 text-muted-foreground">
                                                Penerimaan belum tersedia karena
                                                kapasitas tim/peran,
                                                keanggotaan, status, atau
                                                tenggat. Penolakan dengan alasan
                                                tetap tersedia.
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Section>
                    <Section
                        title="Undangan yang masih aktif"
                        id="team-sent-invitations"
                    >
                        {team.sent_invitations.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada undangan aktif yang perlu dikelola.
                            </p>
                        ) : (
                            <ul
                                className="grid gap-3"
                                aria-label="Undangan tim yang dikirim pemilik"
                            >
                                {team.sent_invitations.map((invitation) => (
                                    <li
                                        key={invitation.id}
                                        className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-4"
                                        data-test={`team-sent-invitation-${invitation.id}`}
                                    >
                                        <p className="font-semibold wrap-anywhere">
                                            {invitation.person?.name ??
                                                'Mahasiswa'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {invitation.role?.title ??
                                                'Peran umum'}
                                            . Berlaku sampai{' '}
                                            {formatDate(invitation.expires_at)}.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={blocked}
                                            className="min-h-11 w-full sm:w-fit"
                                            data-test={`revoke-invitation-${invitation.id}`}
                                            onClick={() =>
                                                openDecision({
                                                    kind: 'revoke-invitation',
                                                    id: invitation.id,
                                                    person:
                                                        invitation.person
                                                            ?.name ??
                                                        'mahasiswa',
                                                })
                                            }
                                        >
                                            Batalkan undangan
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Section>
                </div>
            )}
            <Section
                title={
                    owner
                        ? 'Riwayat keputusan pengajuan'
                        : 'Riwayat pengajuanmu'
                }
                id="team-request-history"
            >
                {!history?.data.length ? (
                    <p className="text-sm text-muted-foreground">
                        Belum ada pengajuan selesai. Pengajuan menunggu
                        ditampilkan di atas.
                    </p>
                ) : (
                    <ul
                        className="grid min-w-0 gap-4"
                        aria-label="Riwayat pengajuan selesai"
                    >
                        {history.data.map((request) => (
                            <li
                                key={request.id}
                                className="grid min-w-0 gap-2 border-b border-border pb-4 wrap-anywhere last:border-b-0"
                            >
                                <p className="font-semibold">
                                    {owner &&
                                        `${request.requester?.name ?? 'Mahasiswa'}. `}
                                    {request.role?.title ?? 'Peran umum'}
                                </p>
                                <p className="text-sm">
                                    {{
                                        accepted: 'Diterima',
                                        rejected: 'Belum diterima',
                                        withdrawn: 'Ditarik',
                                        expired: 'Berakhir',
                                    }[request.status] ??
                                        'Status belum dikenali'}
                                    {request.responded_at &&
                                        `, ${formatDate(request.responded_at)}`}
                                </p>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {request.response_reason ??
                                        (request.status === 'withdrawn'
                                            ? 'Pengajuan ditarik. Tidak memesan tempat atau membentuk keanggotaan.'
                                            : 'Alasan belum tercatat pada pengajuan lama.')}
                                </p>
                                <p className="text-xs leading-5 text-muted-foreground">
                                    {request.status === 'accepted'
                                        ? 'Keputusan ini tercatat pada waktunya. Akses ruang kerja mengikuti keanggotaan dan izin saat ini.'
                                        : owner
                                          ? 'Pemohon dapat mempertimbangkan peran lain. Riwayat ini tetap tersimpan.'
                                          : 'Kamu dapat mempertimbangkan peran lain. Pengajuan baru tidak menghapus riwayat ini.'}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
                {history && history.last_page > 1 && (
                    <nav
                        aria-label="Halaman riwayat pengajuan"
                        className="flex flex-wrap items-center gap-2"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            disabled={blocked || history.current_page <= 1}
                            onClick={() =>
                                reload(undefined, history.current_page - 1)
                            }
                            className="min-h-11"
                        >
                            Sebelumnya
                        </Button>
                        <span className="text-sm">
                            Halaman {history.current_page} dari{' '}
                            {history.last_page}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                blocked ||
                                history.current_page >= history.last_page
                            }
                            onClick={() =>
                                reload(undefined, history.current_page + 1)
                            }
                            className="min-h-11"
                        >
                            Berikutnya
                        </Button>
                    </nav>
                )}
                {!owner && (
                    <Link
                        href={projectsIndex()}
                        className="w-fit cursor-pointer rounded-md text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                        Temukan peluang lain
                    </Link>
                )}
            </Section>
            <p className="flex gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                <ShieldCheck
                    className="mt-0.5 size-4 shrink-0 text-verified"
                    aria-hidden="true"
                />
                <span>
                    Ringkasan pengajuan dan alasan keputusan bukan informasi
                    publik. Bukti privat profil tidak dibagikan melalui panel
                    ini.
                </span>
            </p>
            <Dialog
                open={decision !== null}
                onOpenChange={(open) => {
                    if (!open && !busy) {
                        setDecision(null);
                    }
                }}
            >
                <DialogContent
                    closeButtonDisabled={busy}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();

                        if (
                            trigger.current?.isConnected &&
                            !trigger.current.matches(':disabled')
                        ) {
                            trigger.current.focus();
                        } else {
                            focusTeam();
                        }
                    }}
                >
                    <DialogTitle className="pr-10 wrap-anywhere">
                        {withdrawing
                            ? 'Tarik pengajuanmu?'
                            : accepting
                              ? `Terima ${isJoinDecision ? 'pengajuan' : 'undangan'} ${decision?.person}?`
                              : decision?.kind === 'revoke-invitation'
                                ? `Batalkan undangan untuk ${decision.person}?`
                                : `Tolak ${isJoinDecision ? 'pengajuan' : 'undangan'} ${decision?.person}?`}
                    </DialogTitle>
                    <DialogDescription>
                        {withdrawing
                            ? 'Pemilik tidak lagi dapat menerima pengajuan ini. Riwayat tetap tersimpan; kamu dapat mengajukan kembali jika proyek masih menerima anggota.'
                            : isJoinDecision
                              ? 'Tuliskan alasan terkait kebutuhan peran. Alasan dibagikan kepada pemohon, bukan catatan internal. Hindari kontak, popularitas, dan penilaian kepribadian.'
                              : accepting
                                ? 'Penerimaan diperiksa ulang terhadap kapasitas, tenggat, dan izin terbaru. Keanggotaan baru hanya terbentuk jika berhasil.'
                                : 'Tindakan ini tidak menghapus profil atau riwayat. Catatan terkait kolaborasi bersifat opsional.'}
                    </DialogDescription>
                    {isJoinDecision && <Criteria role={decision?.role} />}
                    {feedback}
                    {(isJoinDecision || (!withdrawing && !accepting)) && (
                        <div className="grid gap-2">
                            <Label htmlFor="owner-decision-reason">
                                {isJoinDecision
                                    ? 'Alasan keputusan (dibagikan kepada pemohon)'
                                    : 'Catatan opsional'}
                            </Label>
                            <textarea
                                id="owner-decision-reason"
                                aria-required={isJoinDecision}
                                value={decisionForm.data.reason}
                                disabled={busy || mustCheck}
                                onChange={(event) =>
                                    decisionForm.setData(
                                        'reason',
                                        event.target.value,
                                    )
                                }
                                rows={3}
                                maxLength={1000}
                                className={textAreaClass}
                                aria-invalid={Boolean(decisionErrors.reason)}
                                aria-describedby="decision-reason-hint"
                            />
                            <p
                                id="decision-reason-hint"
                                className="text-xs leading-5 text-muted-foreground"
                            >
                                {firstError({
                                    reason: decisionErrors.reason,
                                }) ??
                                    (isJoinDecision
                                        ? 'Wajib diisi. Jelaskan kebutuhan yang sesuai atau belum terpenuhi, maksimal 1000 karakter.'
                                        : 'Maksimal 1000 karakter.')}
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={busy}
                                className="min-h-11"
                            >
                                Kembali
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant={accepting ? 'default' : 'destructive'}
                            disabled={blocked}
                            onClick={submitDecision}
                            data-test={
                                isJoinDecision ||
                                decision?.kind === 'revoke-invitation'
                                    ? 'confirm-owner-team-decision'
                                    : withdrawing
                                      ? 'confirm-withdraw-request'
                                      : 'confirm-reject-invitation'
                            }
                            className="min-h-11 whitespace-normal"
                        >
                            {decisionForm.processing && (
                                <Spinner aria-hidden="true" />
                            )}
                            {withdrawing
                                ? 'Ya, tarik pengajuan'
                                : accepting
                                  ? isJoinDecision
                                      ? 'Terima dan bentuk keanggotaan'
                                      : 'Terima undangan'
                                  : decision?.kind === 'revoke-invitation'
                                    ? 'Batalkan undangan'
                                    : isJoinDecision
                                      ? 'Simpan penolakan'
                                      : 'Tolak undangan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
