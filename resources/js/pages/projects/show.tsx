import { Head, Link, router, useHttp, usePage } from '@inertiajs/react';
import {
    Archive,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Circle,
    CircleDot,
    CircleX,
    Clock3,
    Edit3,
    LockKeyhole,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
import ProjectWorkspaceController from '@/actions/App/Http/Controllers/ProjectWorkspaceController';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import { TeamFormationPanel } from '@/components/projects/team-formation-panel';
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
import {
    beginnerLabel,
    capacityLabel,
    opportunityStatus,
} from '@/lib/project-opportunities';
import { cn } from '@/lib/utils';
import { index as projectsIndex, edit as projectEdit } from '@/routes/projects';
import type { Auth } from '@/types/auth';
import type {
    ProjectApiResponse,
    ProjectDetail,
    ProjectStatus,
    ProjectTransitionData,
    ProjectVisibility,
    TeamFormationState,
} from '@/types/project';

type ProjectShowProps = {
    project: ProjectDetail;
    team: TeamFormationState;
    can_edit: boolean;
    can_transition: boolean;
    can_workspace: boolean;
};

type PageProps = {
    auth: Auth;
};

type TransitionAction = 'cancel' | 'archive';

const statusLabels: Record<ProjectStatus, string> = {
    draft: 'Draft',
    open: 'Terbuka',
    forming: 'Membentuk tim',
    full: 'Kapasitas penuh',
    closed: 'Ditutup',
    cancelled: 'Dibatalkan',
    archived: 'Diarsipkan',
};

const statusDescriptions: Record<ProjectStatus, string> = {
    draft: 'Proyek belum dibuka untuk permintaan kolaborasi.',
    open: 'Proyek menerima mahasiswa yang sesuai dengan kebutuhan tim.',
    forming: 'Proyek sedang membentuk tim dengan slot yang tersedia.',
    full: 'Kapasitas proyek sudah penuh untuk saat ini.',
    closed: 'Proyek tidak lagi menerima tindakan baru.',
    cancelled:
        'Proyek dibatalkan oleh pemilik dan tidak menerima tindakan baru.',
    archived:
        'Proyek disimpan sebagai riwayat dan tidak menerima tindakan baru.',
};

const visibilityLabels: Record<ProjectVisibility, string> = {
    private: 'Pribadi milikmu',
    institution: 'Kampus',
    public: 'Publik',
};

const statusIcons: Record<ProjectStatus, LucideIcon> = {
    draft: CircleDot,
    open: CheckCircle2,
    forming: Clock3,
    full: UsersRound,
    closed: Circle,
    cancelled: CircleX,
    archived: Archive,
};

const statusClasses: Record<ProjectStatus, string> = {
    draft: 'border-border bg-muted text-muted-foreground',
    open: 'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
    forming:
        'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    full: 'border-border bg-muted text-muted-foreground',
    closed: 'border-border bg-muted text-muted-foreground',
    cancelled:
        'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
    archived: 'border-border bg-muted text-muted-foreground',
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
});

function displayStatus(status: string): string {
    return statusLabels[status as ProjectStatus] ?? status;
}

function displayVisibility(visibility: string): string {
    return visibilityLabels[visibility as ProjectVisibility] ?? visibility;
}

function displayProficiency(proficiency: string): string {
    return (
        (
            {
                beginner: 'Pemula',
                intermediate: 'Menengah',
                advanced: 'Mahir',
                expert: 'Ahli',
            } as Record<string, string>
        )[proficiency] ?? proficiency
    );
}

function formatDeadline(deadline: string): string {
    const date = new Date(deadline);

    return Number.isNaN(date.getTime())
        ? 'Tanggal belum tersedia'
        : dateFormatter.format(date);
}

function ProjectStatusBadge({ status }: { status: string }) {
    const normalizedStatus = status as ProjectStatus;
    const Icon = statusIcons[normalizedStatus] ?? CircleDot;

    return (
        <span
            data-test="project-status"
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                statusClasses[normalizedStatus] ??
                    'border-border bg-muted text-muted-foreground',
            )}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {displayStatus(status)}
        </span>
    );
}

function ProjectDetailSkeleton() {
    return (
        <div
            data-test="project-detail-skeleton"
            aria-hidden="true"
            className="grid gap-6 rounded-3xl border border-border bg-card p-5 sm:p-6"
        >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-4/5" />
            <div className="grid gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((item) => (
                    <Skeleton key={item} className="h-16" />
                ))}
            </div>
        </div>
    );
}

function ProjectContextRail({ project }: { project: ProjectDetail }) {
    return (
        <div className="grid min-w-0 gap-5 border-t border-border px-1 pt-5">
            <section className="grid gap-3 border-b border-border/60 pb-5">
                <p className="text-xs font-semibold text-primary">
                    Konteks kampus
                </p>
                <h2 className="text-title font-semibold wrap-anywhere">
                    {project.institution.name}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Detail ini mengikuti konteks afiliasi kampus yang berwenang.
                    Informasi pemilik, status, batas waktu, dan kebutuhan tim
                    berasal dari proyek yang sama.
                </p>
            </section>

            <dl className="grid gap-4 text-sm">
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">Pemilik</dt>
                    <dd className="font-semibold wrap-anywhere">
                        {project.owner.name}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">
                        Visibilitas
                    </dt>
                    <dd className="font-semibold">
                        {displayVisibility(project.visibility)}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">
                        Pembaruan terakhir
                    </dt>
                    <dd className="font-semibold">
                        {formatDeadline(project.updated_at)}
                    </dd>
                </div>
            </dl>

            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                Informasi dan tindakan yang tersedia mengikuti izin aksesmu pada
                proyek ini.
            </p>
        </div>
    );
}

function ActionAvailability({ project }: { project: ProjectDetail }) {
    const status = project.status as ProjectStatus;

    if (status === 'draft') {
        return 'Buka proyek setelah kebutuhan tim dan batas waktu siap.';
    }

    if (status === 'open' || status === 'forming' || status === 'full') {
        return 'Proyek sedang berjalan. Aksi buka ulang tidak tersedia pada status ini.';
    }

    if (status === 'closed' || status === 'cancelled') {
        return 'Proyek hanya dapat diarsipkan sebagai riwayat.';
    }

    return 'Proyek ini bersifat baca-saja karena status proyek sudah selesai.';
}

function ProjectActionRail({
    project,
    canEdit,
    canTransition,
    canWorkspace,
    canRequestJoin,
    processing,
    onOpen,
    onDestructiveAction,
}: {
    project: ProjectDetail;
    canEdit: boolean;
    canTransition: boolean;
    canWorkspace: boolean;
    canRequestJoin: boolean;
    processing: boolean;
    onOpen: () => void;
    onDestructiveAction: (action: TransitionAction) => void;
}) {
    const status = project.status as ProjectStatus;

    return (
        <section
            aria-labelledby="project-actions-title"
            data-test="project-actions"
            className="grid min-w-0 gap-3 rounded-3xl border border-primary/20 bg-linear-to-br from-card to-background p-5 shadow-md sm:grid-cols-2 sm:p-6"
        >
            <h2
                id="project-actions-title"
                className="text-sm font-semibold text-primary sm:col-span-2"
            >
                Langkah berikutnya
            </h2>
            {canRequestJoin && (
                <Button
                    asChild
                    className="min-h-11 w-full shadow-sm hover:shadow-md motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-standard motion-safe:active:translate-y-0.5 sm:col-span-2"
                >
                    <a href="#team-join-request-form">Ajukan bergabung</a>
                </Button>
            )}
            {canEdit && (status === 'draft' || status === 'open') && (
                <Button
                    asChild
                    variant="outline"
                    className="h-auto min-h-11 w-full cursor-pointer py-3 whitespace-normal"
                    data-test="edit-project"
                >
                    <Link href={projectEdit(project.id)}>
                        <Edit3 aria-hidden="true" />
                        Ubah detail proyek
                    </Link>
                </Button>
            )}
            {canWorkspace && (
                <Button
                    asChild
                    className="w-full cursor-pointer shadow-sm hover:shadow-md motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-standard motion-safe:active:translate-y-0.5"
                    data-test="open-workspace"
                >
                    <Link href={ProjectWorkspaceController.show(project.id)}>
                        <ClipboardList aria-hidden="true" />
                        Buka ruang kerja
                    </Link>
                </Button>
            )}
            {canTransition && status === 'draft' && (
                <Button
                    type="button"
                    className="w-full cursor-pointer"
                    disabled={processing}
                    onClick={onOpen}
                    data-test="open-project"
                >
                    {processing && <Spinner aria-hidden="true" />}
                    Buka proyek
                </Button>
            )}
            {canTransition &&
                (status === 'open' ||
                    status === 'forming' ||
                    status === 'full') && (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer border-correction/30 text-correction hover:border-correction hover:bg-correction-subtle hover:text-correction-subtle-foreground"
                        disabled={processing}
                        onClick={() => onDestructiveAction('cancel')}
                        data-test="cancel-project"
                    >
                        Batalkan proyek
                    </Button>
                )}
            {canTransition &&
                (status === 'closed' || status === 'cancelled') && (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer"
                        disabled={processing}
                        onClick={() => onDestructiveAction('archive')}
                        data-test="archive-project"
                    >
                        <Archive aria-hidden="true" />
                        Arsipkan proyek
                    </Button>
                )}
            {!canEdit && !canTransition && (
                <div
                    data-test="project-read-only"
                    className="flex min-w-0 items-start gap-2 rounded-xl border border-border bg-background/60 px-3 py-3 text-sm text-muted-foreground sm:col-span-2"
                >
                    <LockKeyhole
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                    />
                    <p>
                        Detail dikelola pemilik proyek. Tindakan bergabung
                        mengikuti status tim dan izin akunmu.
                    </p>
                </div>
            )}
            {canTransition && (
                <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">
                    {ActionAvailability({ project })}
                </p>
            )}
        </section>
    );
}

export default function ProjectShow({
    project: initialProject,
    team,
    can_edit: canEdit,
    can_transition: canTransition,
    can_workspace: canWorkspace,
}: ProjectShowProps) {
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

    function transitionErrorMessage(): string | undefined {
        const message = transitionErrors.status ?? transitionErrors.reason;

        return Array.isArray(message) ? message[0] : message;
    }

    function runTransition(action: 'open' | TransitionAction) {
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
    }

    if (accessDenied) {
        return (
            <AppPage>
                <Head title="Akses proyek tidak tersedia" />
                <section
                    className="space-y-4 rounded-3xl border border-border bg-card p-6"
                    data-test="project-access-denied"
                >
                    <h1 className="text-2xl font-bold">
                        Akses proyek tidak tersedia
                    </h1>
                    <p>
                        Informasi proyek sebelumnya disembunyikan. Periksa
                        afiliasi atau buka peluang lain.
                    </p>
                    <Button asChild variant="outline">
                        <Link href={projectsIndex()}>Kembali ke peluang</Link>
                    </Button>
                </section>
            </AppPage>
        );
    }

    return (
        <>
            <Head title={project.title} />
            <AppPage>
                <div
                    data-test="project-detail-root"
                    data-project-status={project.status}
                    aria-busy={isRefreshing}
                    className="grid w-full min-w-0 gap-6"
                >
                    <header className="relative isolate grid min-w-0 gap-5 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent to-sky-100 p-5 shadow-md sm:p-7">
                        <ArchiveArt className="absolute top-5 right-5 -z-10 hidden w-36 -rotate-6 opacity-55 lg:block" />
                        <div className="min-w-0 space-y-3 lg:pr-40">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-label text-label text-muted-foreground">
                                    PROYEK {String(project.id).padStart(4, '0')}
                                </span>
                                <ProjectStatusBadge status={project.status} />
                            </div>
                            <h1 className="max-w-[28ch] text-headline font-bold text-balance wrap-anywhere">
                                {project.title}
                            </h1>
                            <p className="max-w-[70ch] text-body text-muted-foreground">
                                {statusDescriptions[status] ??
                                    'Status proyek belum memiliki penjelasan tambahan.'}
                            </p>
                        </div>

                        <div className="grid min-w-0 gap-2 border-t border-white/80 pt-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-verified"
                                />
                                <span className="text-xs">Pemilik proyek</span>
                            </div>
                            <p className="font-semibold wrap-anywhere">
                                {project.owner.name}
                            </p>
                            <p className="text-xs leading-5 text-muted-foreground">
                                {isOwner
                                    ? 'Kamu mengelola detail, kebutuhan tim, dan status proyek ini.'
                                    : 'Detail dikelola pemilik. Kamu dapat melihat tindakan yang tersedia sesuai status tim.'}
                            </p>
                        </div>
                    </header>

                    <div
                        data-test="project-detail-grid"
                        className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                    >
                        <div className="grid min-w-0 gap-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="cursor-pointer px-0 hover:bg-transparent hover:underline"
                                >
                                    <Link href={projectsIndex()}>
                                        Kembali ke daftar proyek
                                    </Link>
                                </Button>
                                {isRefreshing && (
                                    <p
                                        role="status"
                                        aria-live="polite"
                                        className="flex items-center gap-2 text-sm text-muted-foreground"
                                    >
                                        <Spinner aria-hidden="true" />
                                        Memuat data proyek terbaru...
                                    </p>
                                )}
                            </div>

                            {actionMessage && (
                                <p
                                    role="status"
                                    aria-live="polite"
                                    data-test="project-action-success"
                                    className="rounded-2xl border border-verified/40 bg-verified-subtle px-4 py-3 text-sm text-verified-subtle-foreground"
                                >
                                    {actionMessage}
                                </p>
                            )}

                            {transitionErrorMessage() && (
                                <p
                                    role="alert"
                                    data-test="project-transition-error"
                                    className="rounded-2xl border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                                >
                                    {transitionErrorMessage()}
                                </p>
                            )}

                            {actionError && (
                                <p
                                    role="alert"
                                    data-test="project-action-error"
                                    className="rounded-2xl border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                                >
                                    {actionError}
                                </p>
                            )}

                            {isRefreshing ? (
                                <ProjectDetailSkeleton />
                            ) : (
                                <div
                                    aria-busy={transitionForm.processing}
                                    data-test="project-detail-content"
                                    className="grid min-w-0 gap-6"
                                >
                                    <ProjectActionRail
                                        project={project}
                                        canEdit={normalizedCanEdit}
                                        canTransition={canTransition}
                                        processing={transitionForm.processing}
                                        onOpen={() => runTransition('open')}
                                        onDestructiveAction={(action) => {
                                            actionTrigger.current =
                                                document.activeElement instanceof
                                                HTMLElement
                                                    ? document.activeElement
                                                    : null;
                                            setPendingAction(action);
                                        }}
                                        canWorkspace={canWorkspace}
                                        canRequestJoin={canRequestJoin}
                                    />

                                    <section className="grid min-w-0 gap-5 px-1 py-2">
                                        <div className="grid gap-2">
                                            <p className="text-xs font-semibold text-primary">
                                                Tentang proyek
                                            </p>
                                            <h2 className="text-title font-semibold">
                                                Konteks kerja yang perlu
                                                dipahami
                                            </h2>
                                        </div>
                                        {project.description ? (
                                            <p className="max-w-[78ch] text-body leading-7 wrap-anywhere whitespace-pre-line">
                                                {project.description}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Deskripsi proyek belum
                                                ditambahkan.
                                            </p>
                                        )}
                                        <dl className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
                                            <div className="grid min-w-0 gap-1">
                                                <dt className="font-label text-label text-muted-foreground">
                                                    Batas waktu
                                                </dt>
                                                <dd className="flex items-start gap-2 text-sm font-semibold wrap-anywhere">
                                                    <CalendarDays
                                                        aria-hidden="true"
                                                        className="mt-0.5 size-4 shrink-0 text-primary"
                                                    />
                                                    {formatDeadline(
                                                        project.deadline,
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="grid min-w-0 gap-1">
                                                <dt className="font-label text-label text-muted-foreground">
                                                    KAPASITAS TIM
                                                </dt>
                                                <dd className="flex items-start gap-2 text-sm font-semibold wrap-anywhere">
                                                    <UsersRound
                                                        aria-hidden="true"
                                                        className="mt-0.5 size-4 shrink-0 text-primary"
                                                    />
                                                    <span>
                                                        {capacityLabel(
                                                            project.capacity_stats,
                                                            project.capacity,
                                                        )}
                                                        <span className="mt-2 block text-xs leading-5 font-normal text-muted-foreground">
                                                            {opportunityStatus(
                                                                project.capacity_stats,
                                                                project.status,
                                                                project.deadline,
                                                            )}
                                                        </span>
                                                    </span>
                                                </dd>
                                            </div>
                                            <div className="grid min-w-0 gap-1">
                                                <dt className="font-label text-label text-muted-foreground">
                                                    VISIBILITAS
                                                </dt>
                                                <dd className="text-sm font-semibold wrap-anywhere">
                                                    {displayVisibility(
                                                        project.visibility,
                                                    )}
                                                </dd>
                                            </div>
                                        </dl>
                                    </section>

                                    <section
                                        aria-labelledby="project-requirements-title"
                                        className="grid min-w-0 gap-5 border-t border-border px-1 pt-6"
                                    >
                                        <div className="grid gap-2 border-b border-border pb-3">
                                            <p className="text-xs font-semibold text-primary">
                                                Kebutuhan tim
                                            </p>
                                            <h2
                                                id="project-requirements-title"
                                                className="text-title font-semibold"
                                            >
                                                Peran dan keahlian yang
                                                dibutuhkan
                                            </h2>
                                        </div>
                                        {project.roles.length > 0 ? (
                                            <ol
                                                data-test="project-requirements"
                                                className="grid min-w-0 gap-3"
                                            >
                                                {project.roles.map(
                                                    (role, index) => (
                                                        <li
                                                            key={role.id}
                                                            className="grid min-w-0 gap-4 rounded-3xl border border-border bg-linear-to-br from-card to-accent/45 p-5 shadow-sm sm:grid-cols-[2rem_minmax(0,1fr)] sm:p-6"
                                                        >
                                                            <span className="font-label text-label text-primary">
                                                                {String(
                                                                    index + 1,
                                                                ).padStart(
                                                                    2,
                                                                    '0',
                                                                )}
                                                            </span>
                                                            <div className="min-w-0 space-y-2">
                                                                <h3 className="text-xl leading-tight font-bold tracking-tight wrap-anywhere">
                                                                    {role.title}
                                                                </h3>
                                                                {role.description && (
                                                                    <p className="text-sm leading-6 wrap-anywhere whitespace-pre-line text-muted-foreground">
                                                                        {
                                                                            role.description
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="grid min-w-0 gap-3 sm:col-start-2">
                                                                <p className="flex items-center gap-2 text-sm font-semibold">
                                                                    <UsersRound
                                                                        aria-hidden="true"
                                                                        className="size-4 shrink-0 text-primary"
                                                                    />
                                                                    Kapasitas
                                                                    peran:{' '}
                                                                    {
                                                                        role.capacity
                                                                    }{' '}
                                                                    orang
                                                                </p>
                                                                <p className="text-sm font-semibold text-primary">
                                                                    {beginnerLabel(
                                                                        role.accepts_beginners,
                                                                    )}
                                                                </p>
                                                                <p className="text-sm leading-6">
                                                                    {capacityLabel(
                                                                        role.capacity_stats,
                                                                        role.capacity,
                                                                    )}
                                                                </p>
                                                                <p className="text-xs leading-5 text-muted-foreground">
                                                                    Sisa peran
                                                                    tetap
                                                                    dibatasi
                                                                    kapasitas
                                                                    tim.{' '}
                                                                    {role
                                                                        .capacity_stats
                                                                        ?.accepting ===
                                                                    false
                                                                        ? 'Peran ini belum menerima pengajuan baru.'
                                                                        : ''}
                                                                </p>
                                                                <div className="border-t border-border pt-3">
                                                                    <h4 className="text-sm font-semibold">
                                                                        Kriteria
                                                                        pemilihan
                                                                    </h4>
                                                                    <p className="mt-2 text-sm leading-6 wrap-anywhere whitespace-pre-line text-muted-foreground">
                                                                        {role.selection_criteria ||
                                                                            'Kriteria belum dinyatakan oleh pemilik.'}
                                                                    </p>
                                                                </div>
                                                                {role.skills
                                                                    .length >
                                                                0 ? (
                                                                    <ul className="flex min-w-0 flex-wrap gap-1.5">
                                                                        {role.skills.map(
                                                                            (
                                                                                skill,
                                                                            ) => (
                                                                                <li
                                                                                    key={
                                                                                        skill.taxonomy_id
                                                                                    }
                                                                                    className="max-w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs wrap-anywhere"
                                                                                >
                                                                                    {skill.name ??
                                                                                        `Keahlian #${skill.taxonomy_id}`}{' '}
                                                                                    <span className="text-muted-foreground">
                                                                                        (
                                                                                        {displayProficiency(
                                                                                            skill.proficiency,
                                                                                        )}

                                                                                        )
                                                                                    </span>
                                                                                </li>
                                                                            ),
                                                                        )}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Keahlian
                                                                        minimum
                                                                        belum
                                                                        dirinci.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </li>
                                                    ),
                                                )}
                                            </ol>
                                        ) : (
                                            <p className="border-y border-border py-5 text-sm text-muted-foreground">
                                                Kebutuhan peran belum tersedia.
                                            </p>
                                        )}
                                        {allSkills.length > 0 && (
                                            <p className="text-xs leading-5 text-muted-foreground">
                                                {allSkills.length} keahlian
                                                minimum menjadi bagian dari
                                                kebutuhan tim proyek ini.
                                            </p>
                                        )}
                                    </section>

                                    <TeamFormationPanel
                                        projectId={project.id}
                                        canWorkspace={canWorkspace}
                                        roles={project.roles}
                                        onAccessDenied={() =>
                                            setAccessDenied(true)
                                        }
                                        team={team}
                                    />
                                </div>
                            )}
                        </div>
                        <aside aria-label="Konteks proyek" className="min-w-0">
                            <ProjectContextRail project={project} />
                        </aside>
                    </div>
                </div>
            </AppPage>

            <Dialog
                open={pendingAction !== null}
                onOpenChange={(open) => {
                    if (!open && !transitionForm.processing) {
                        setPendingAction(null);
                    }
                }}
            >
                <DialogContent
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        actionTrigger.current?.focus();
                    }}
                >
                    <DialogTitle className="pr-10">
                        {pendingAction === 'cancel'
                            ? 'Batalkan proyek ini?'
                            : 'Arsipkan proyek ini?'}
                    </DialogTitle>
                    <DialogDescription>
                        {pendingAction === 'cancel'
                            ? 'Proyek tidak lagi menerima tindakan baru. Riwayat audit tetap dipertahankan dan pembatalan tidak dapat dibatalkan dari halaman ini.'
                            : 'Proyek akan dipindahkan menjadi riwayat baca-saja. Pastikan status proyek memang sudah selesai.'}
                    </DialogDescription>
                    <div className="grid gap-2">
                        <label
                            htmlFor="project-transition-reason"
                            className="text-sm font-semibold"
                        >
                            Alasan (opsional)
                        </label>
                        <Input
                            id="project-transition-reason"
                            data-test="project-transition-reason"
                            value={transitionForm.data.reason}
                            onChange={(event) =>
                                transitionForm.setData(
                                    'reason',
                                    event.target.value,
                                )
                            }
                            placeholder="Contoh: Cakupan proyek berubah"
                            maxLength={1000}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                disabled={transitionForm.processing}
                            >
                                Kembali
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            className="cursor-pointer"
                            disabled={transitionForm.processing}
                            data-test="confirm-project-transition"
                            onClick={() => {
                                if (pendingAction !== null) {
                                    runTransition(pendingAction);
                                }
                            }}
                        >
                            {transitionForm.processing && (
                                <Spinner aria-hidden="true" />
                            )}
                            {pendingAction === 'cancel'
                                ? 'Ya, batalkan proyek'
                                : 'Ya, arsipkan proyek'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProjectShow.layout = {
    breadcrumbs: [
        {
            title: 'Penemuan proyek',
            href: projectsIndex(),
        },
        {
            title: 'Detail proyek',
        },
    ],
};
