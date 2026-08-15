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
import { useEffect, useMemo, useState } from 'react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
import ProjectWorkspaceController from '@/actions/App/Http/Controllers/ProjectWorkspaceController';
import { AppPage } from '@/components/app-page';
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
    draft: 'Project belum dibuka untuk permintaan kolaborasi.',
    open: 'Project menerima mahasiswa yang sesuai dengan requirements.',
    forming: 'Project sedang membentuk tim dengan slot yang tersedia.',
    full: 'Kapasitas project sudah penuh untuk saat ini.',
    closed: 'Project tidak lagi menerima tindakan baru.',
    cancelled:
        'Project dibatalkan oleh pemilik dan tidak menerima tindakan baru.',
    archived:
        'Project disimpan sebagai riwayat dan tidak menerima tindakan baru.',
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
                'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold',
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
            className="grid gap-6 border-y border-border py-6"
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
        <div className="grid gap-6">
            <section className="grid gap-3 border-b border-border pb-5">
                <p className="font-label text-label text-primary">PROVENANCE</p>
                <h2 className="text-title font-semibold break-words">
                    {project.institution.name}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Detail ini mengikuti konteks afiliasi kampus yang berwenang.
                    Informasi owner, status, deadline, dan requirements dibaca
                    dari project yang sama.
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
                        VISIBILITAS
                    </dt>
                    <dd className="font-semibold">
                        {displayVisibility(project.visibility)}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        PEMBARUAN TERAKHIR
                    </dt>
                    <dd className="font-semibold">
                        {formatDeadline(project.updated_at)}
                    </dd>
                </div>
            </dl>

            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                Penjelasan kecocokan dan tindakan kolaborasi mengikuti
                permission project. Sinyal inclusion atau data privat tidak
                ditampilkan di halaman ini.
            </p>
        </div>
    );
}

function ActionAvailability({ project }: { project: ProjectDetail }) {
    const status = project.status as ProjectStatus;

    if (status === 'draft') {
        return 'Buka project setelah requirements dan deadline siap.';
    }

    if (status === 'open' || status === 'forming' || status === 'full') {
        return 'Project sedang berjalan. Aksi buka ulang tidak tersedia pada status ini.';
    }

    if (status === 'closed' || status === 'cancelled') {
        return 'Project hanya dapat diarsipkan sebagai riwayat.';
    }

    return 'Project ini bersifat baca-saja karena lifecycle sudah selesai.';
}

function ProjectActionRail({
    project,
    canEdit,
    canTransition,
    canWorkspace,
    processing,
    onOpen,
    onDestructiveAction,
}: {
    project: ProjectDetail;
    canEdit: boolean;
    canTransition: boolean;
    canWorkspace: boolean;
    processing: boolean;
    onOpen: () => void;
    onDestructiveAction: (action: TransitionAction) => void;
}) {
    const status = project.status as ProjectStatus;

    return (
        <section
            aria-labelledby="project-actions-title"
            data-test="project-actions"
            className="grid gap-3 border-t border-border pt-5"
        >
            <h2
                id="project-actions-title"
                className="font-label text-label text-muted-foreground"
            >
                AKSI PEMILIK
            </h2>
            {canEdit && (status === 'draft' || status === 'open') && (
                <Button
                    asChild
                    variant="outline"
                    className="w-full cursor-pointer"
                    data-test="edit-project"
                >
                    <Link href={projectEdit(project.id)}>
                        <Edit3 aria-hidden="true" />
                        Edit detail project
                    </Link>
                </Button>
            )}
            {canWorkspace && (
                <Button
                    asChild
                    variant="outline"
                    className="w-full cursor-pointer"
                    data-test="open-workspace"
                >
                    <Link href={ProjectWorkspaceController.show(project.id)}>
                        <ClipboardList aria-hidden="true" />
                        Buka workspace task
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
                    Buka project
                </Button>
            )}
            {canTransition &&
                (status === 'open' ||
                    status === 'forming' ||
                    status === 'full') && (
                    <Button
                        type="button"
                        variant="destructive"
                        className="w-full cursor-pointer"
                        disabled={processing}
                        onClick={() => onDestructiveAction('cancel')}
                        data-test="cancel-project"
                    >
                        Batalkan project
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
                        Arsipkan project
                    </Button>
                )}
            {!canEdit && !canTransition && (
                <div
                    data-test="project-read-only"
                    className="flex items-start gap-2 border border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground"
                >
                    <LockKeyhole
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                    />
                    <p>
                        Mode baca. Hanya owner yang dapat mengubah project ini.
                    </p>
                </div>
            )}
            {canTransition && (
                <p className="text-xs leading-5 text-muted-foreground">
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
    const [pendingAction, setPendingAction] = useState<TransitionAction | null>(
        null,
    );
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
        const isTeamOnlyReload = (visit: { only: string[] }): boolean =>
            visit.only.length === 1 && visit.only[0] === 'team';
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
                setActionError(
                    response.status === 409
                        ? 'Project sudah berubah di sesi lain. Muat ulang halaman sebelum mencoba lagi.'
                        : 'Lifecycle project belum dapat diubah. Periksa status dan deadline project.',
                );

                return false;
            },
            onNetworkError: () => {
                setActionError(
                    'Perubahan lifecycle belum tersimpan. Periksa koneksi lalu coba lagi.',
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
                        ? 'Project berhasil dibuka.'
                        : action === 'cancel'
                          ? 'Project berhasil dibatalkan.'
                          : 'Project berhasil diarsipkan.',
                );
            })
            .catch(() => undefined);
    }

    return (
        <>
            <Head title={project.title} />
            <AppPage
                contextRail={<ProjectContextRail project={project} />}
                contextRailLabel="Provenance project"
            >
                <div
                    data-test="project-detail-root"
                    data-project-status={project.status}
                    aria-busy={isRefreshing}
                    className="mx-auto grid max-w-6xl min-w-0 gap-7"
                >
                    <header className="grid gap-5 border-b border-border pb-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-end xl:gap-10">
                        <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-label text-label text-muted-foreground">
                                    PROJECT{' '}
                                    {String(project.id).padStart(4, '0')}
                                </span>
                                <ProjectStatusBadge status={project.status} />
                            </div>
                            <h1 className="max-w-[28ch] text-headline font-bold text-balance break-words">
                                {project.title}
                            </h1>
                            <p className="max-w-[70ch] text-body text-muted-foreground">
                                {statusDescriptions[status] ??
                                    'Status project belum memiliki penjelasan tambahan.'}
                            </p>
                        </div>

                        <div className="grid gap-2 border border-border bg-card/60 px-4 py-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-verified"
                                />
                                <span className="font-label text-label">
                                    PEMILIK PROJECT
                                </span>
                            </div>
                            <p className="font-semibold break-words">
                                {project.owner.name}
                            </p>
                            <p className="text-xs leading-5 text-muted-foreground">
                                {isOwner
                                    ? 'Kamu mengelola detail dan lifecycle project ini.'
                                    : 'Mode baca. Kamu melihat project ini tanpa akses untuk mengubahnya.'}
                            </p>
                        </div>
                    </header>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button
                            asChild
                            variant="ghost"
                            className="cursor-pointer px-0 hover:bg-transparent hover:underline"
                        >
                            <Link href={projectsIndex()}>
                                Kembali ke discovery
                            </Link>
                        </Button>
                        {isRefreshing && (
                            <p
                                role="status"
                                aria-live="polite"
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                                <Spinner aria-hidden="true" />
                                Memuat data project terbaru...
                            </p>
                        )}
                    </div>

                    {actionMessage && (
                        <p
                            role="status"
                            aria-live="polite"
                            data-test="project-action-success"
                            className="border border-verified/40 bg-verified-subtle px-4 py-3 text-sm text-verified-subtle-foreground"
                        >
                            {actionMessage}
                        </p>
                    )}

                    {transitionErrorMessage() && (
                        <p
                            role="alert"
                            data-test="project-transition-error"
                            className="border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                        >
                            {transitionErrorMessage()}
                        </p>
                    )}

                    {actionError && (
                        <p
                            role="alert"
                            data-test="project-action-error"
                            className="border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                        >
                            {actionError}
                        </p>
                    )}

                    {isRefreshing ? (
                        <ProjectDetailSkeleton />
                    ) : (
                        <main
                            aria-busy={transitionForm.processing}
                            data-test="project-detail-content"
                            className="grid min-w-0 gap-8"
                        >
                            <section className="grid gap-5 border-y border-border py-6">
                                <div className="grid gap-2">
                                    <p className="font-label text-label text-muted-foreground">
                                        RINGKASAN PROJECT
                                    </p>
                                    <h2 className="text-title font-semibold">
                                        Konteks kerja yang perlu dipahami
                                    </h2>
                                </div>
                                {project.description ? (
                                    <p className="max-w-[78ch] text-body leading-7 break-words whitespace-pre-line">
                                        {project.description}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Deskripsi project belum ditambahkan.
                                    </p>
                                )}
                                <dl className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
                                    <div className="grid min-w-0 gap-1">
                                        <dt className="font-label text-label text-muted-foreground">
                                            DEADLINE
                                        </dt>
                                        <dd className="flex items-start gap-2 text-sm font-semibold break-words">
                                            <CalendarDays
                                                aria-hidden="true"
                                                className="mt-0.5 size-4 shrink-0 text-primary"
                                            />
                                            {formatDeadline(project.deadline)}
                                        </dd>
                                    </div>
                                    <div className="grid min-w-0 gap-1">
                                        <dt className="font-label text-label text-muted-foreground">
                                            KAPASITAS TIM
                                        </dt>
                                        <dd className="flex items-start gap-2 text-sm font-semibold break-words">
                                            <UsersRound
                                                aria-hidden="true"
                                                className="mt-0.5 size-4 shrink-0 text-primary"
                                            />
                                            {project.capacity} orang
                                        </dd>
                                    </div>
                                    <div className="grid min-w-0 gap-1">
                                        <dt className="font-label text-label text-muted-foreground">
                                            VISIBILITAS
                                        </dt>
                                        <dd className="text-sm font-semibold break-words">
                                            {displayVisibility(
                                                project.visibility,
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </section>

                            <section
                                aria-labelledby="project-requirements-title"
                                className="grid gap-5"
                            >
                                <div className="grid gap-2 border-b border-border pb-3">
                                    <p className="font-label text-label text-muted-foreground">
                                        PERSYARATAN
                                    </p>
                                    <h2
                                        id="project-requirements-title"
                                        className="text-title font-semibold"
                                    >
                                        Peran, kapasitas, dan skill minimum
                                    </h2>
                                </div>
                                {project.roles.length > 0 ? (
                                    <ol
                                        data-test="project-requirements"
                                        className="grid min-w-0 gap-0"
                                    >
                                        {project.roles.map((role, index) => (
                                            <li
                                                key={role.id}
                                                className="grid min-w-0 gap-4 border-b border-border py-5 first:border-t sm:grid-cols-[4rem_minmax(0,1fr)_minmax(10rem,0.45fr)] sm:gap-6"
                                            >
                                                <span className="font-label text-label text-primary">
                                                    {String(index + 1).padStart(
                                                        2,
                                                        '0',
                                                    )}
                                                </span>
                                                <div className="min-w-0 space-y-2">
                                                    <h3 className="text-lg font-semibold break-words">
                                                        {role.title}
                                                    </h3>
                                                    {role.description && (
                                                        <p className="text-sm leading-6 break-words whitespace-pre-line text-muted-foreground">
                                                            {role.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="grid min-w-0 gap-3 sm:border-l sm:border-border sm:pl-5">
                                                    <p className="flex items-center gap-2 text-sm font-semibold">
                                                        <UsersRound
                                                            aria-hidden="true"
                                                            className="size-4 shrink-0 text-primary"
                                                        />
                                                        {role.capacity} slot
                                                    </p>
                                                    {role.skills.length > 0 ? (
                                                        <ul className="flex min-w-0 flex-wrap gap-1.5">
                                                            {role.skills.map(
                                                                (skill) => (
                                                                    <li
                                                                        key={
                                                                            skill.taxonomy_id
                                                                        }
                                                                        className="max-w-full rounded-sm border border-border bg-muted/60 px-2 py-1 text-xs break-words"
                                                                    >
                                                                        {skill.name ??
                                                                            `Skill #${skill.taxonomy_id}`}{' '}
                                                                        <span className="text-muted-foreground">
                                                                            (
                                                                            {
                                                                                skill.proficiency
                                                                            }
                                                                            )
                                                                        </span>
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">
                                                            Skill minimum belum
                                                            dirinci.
                                                        </p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="border-y border-border py-5 text-sm text-muted-foreground">
                                        Requirements role belum tersedia.
                                    </p>
                                )}
                                {allSkills.length > 0 && (
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        {allSkills.length} skill terverifikasi
                                        menjadi bagian dari requirements project
                                        ini.
                                    </p>
                                )}
                            </section>

                            <ProjectActionRail
                                project={project}
                                canEdit={normalizedCanEdit}
                                canTransition={canTransition}
                                processing={transitionForm.processing}
                                onOpen={() => runTransition('open')}
                                onDestructiveAction={setPendingAction}
                                canWorkspace={canWorkspace}
                            />

                            <TeamFormationPanel
                                projectId={project.id}
                                roles={project.roles}
                                team={team}
                            />
                        </main>
                    )}
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
                <DialogContent>
                    <DialogTitle>
                        {pendingAction === 'cancel'
                            ? 'Batalkan project ini?'
                            : 'Arsipkan project ini?'}
                    </DialogTitle>
                    <DialogDescription>
                        {pendingAction === 'cancel'
                            ? 'Project tidak lagi menerima tindakan baru. Riwayat audit tetap dipertahankan dan pembatalan tidak dapat dibatalkan dari halaman ini.'
                            : 'Project akan dipindahkan menjadi riwayat read-only. Pastikan lifecycle project memang sudah selesai.'}
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
                            placeholder="Contoh: Scope project berubah"
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
                                ? 'Ya, batalkan project'
                                : 'Ya, arsipkan project'}
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
            title: 'Project discovery',
            href: projectsIndex(),
        },
        {
            title: 'Detail project',
        },
    ],
};
