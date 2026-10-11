import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Circle,
    CircleDot,
    CircleX,
    Clock3,
    Filter,
    Plus,
    Search,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import Mascot from '@/components/mascot';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    beginnerLabel,
    capacityLabel,
    opportunityStatus,
} from '@/lib/project-opportunities';
import type { CapacityStats } from '@/lib/project-opportunities';
import { cn } from '@/lib/utils';
import { index as opportunitySupport } from '@/routes/opportunity-support';
import {
    create as projectsCreate,
    index as projectsIndex,
    show as projectShow,
} from '@/routes/projects';
import type { QueryParams } from '@/wayfinder';

type ProjectStatus =
    'draft' | 'open' | 'forming' | 'full' | 'closed' | 'cancelled' | 'archived';
type ProjectVisibility = 'private' | 'institution' | 'public';

type ProjectRole = {
    id: number;
    title: string;
    description: string | null;
    capacity: number;
    accepts_beginners?: boolean | null;
    selection_criteria?: string | null;
    capacity_stats?: CapacityStats;
    skills: {
        id: number;
        name: string;
        proficiency: string;
    }[];
};

type ProjectSummary = {
    id: number;
    institution_id: number;
    institution: {
        id: number;
        name: string;
    };
    owner_id: number;
    owner: {
        id: number;
        name: string;
    };
    title: string;
    description: string | null;
    status: ProjectStatus | string;
    visibility: ProjectVisibility | string;
    capacity: number;
    deadline: string;
    capacity_stats?: CapacityStats;
    roles: ProjectRole[];
    created_at: string;
    updated_at: string;
};

type ProjectPagination = {
    data: ProjectSummary[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
};

type DiscoveryFilters = {
    view: 'opportunities' | 'mine';
    beginner?: 'all' | 'accepting';
    availability?: 'all' | 'available';
    q: string;
    status: string[];
    visibility: string[];
    sort: string;
    direction: string;
    institution_id: number;
    per_page: number;
    page: number;
};

type FilterOptions = {
    status: string[];
    visibility: string[];
    sort: string[];
    direction: string[];
    per_page: {
        default: number;
        max: number;
    };
};

type ProjectIndexProps = {
    institution: {
        id: number;
        name: string;
    };
    projects: ProjectPagination;
    filters: DiscoveryFilters;
    filter_options: FilterOptions;
};

const statusLabels: Record<ProjectStatus, string> = {
    draft: 'Draft',
    archived: 'Diarsipkan',
    open: 'Terbuka',
    forming: 'Membentuk tim',
    full: 'Kapasitas penuh',
    closed: 'Ditutup',
    cancelled: 'Dibatalkan',
};

const visibilityLabels: Record<ProjectVisibility, string> = {
    private: 'Privat',
    institution: 'Kampus',
    public: 'Publik',
};

const statusIcons: Record<ProjectStatus, LucideIcon> = {
    draft: CircleDot,
    archived: Circle,
    open: CheckCircle2,
    forming: Clock3,
    full: UsersRound,
    closed: Circle,
    cancelled: CircleX,
};

const statusClasses: Record<ProjectStatus, string> = {
    draft: 'border-border bg-muted text-muted-foreground',
    archived: 'border-border bg-muted text-muted-foreground',
    open: 'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
    forming:
        'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    full: 'border-border bg-muted text-muted-foreground',
    closed: 'border-border bg-muted text-muted-foreground',
    cancelled:
        'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
};

const selectClassName =
    'h-11 min-w-0 w-full cursor-pointer rounded-xl border border-input bg-card px-3 text-base text-foreground transition-colors duration-fast hover:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
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
    const labels: Record<string, string> = {
        beginner: 'Pemula',
        intermediate: 'Menengah',
        advanced: 'Mahir',
        expert: 'Ahli',
    };

    return labels[proficiency] ?? proficiency;
}

function formatDeadline(deadline: string): string {
    const dateParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(deadline);
    const date = dateParts
        ? new Date(
              Date.UTC(
                  Number(dateParts[1]),
                  Number(dateParts[2]) - 1,
                  Number(dateParts[3]),
              ),
          )
        : new Date(deadline);

    return Number.isNaN(date.getTime())
        ? 'Tanggal belum tersedia'
        : dateFormatter.format(date);
}

function pageNumbers(currentPage: number, lastPage: number): number[] {
    const windowSize = 5;
    const end = Math.min(lastPage, Math.max(currentPage + 2, windowSize));
    const start = Math.max(1, Math.min(currentPage - 2, end - windowSize + 1));

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function ProjectStatusBadge({ status }: { status: string }) {
    const Icon = statusIcons[status as ProjectStatus] ?? CircleDot;
    const normalizedStatus = status as ProjectStatus;

    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                statusClasses[normalizedStatus] ??
                    'border-border bg-muted text-muted-foreground',
            )}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {displayStatus(status)}
        </span>
    );
}

function ProjectLedgerRow({ project }: { project: ProjectSummary }) {
    const skills = useMemo(
        () =>
            Array.from(
                new Map(
                    project.roles
                        .flatMap((role) => role.skills)
                        .map((skill) => [skill.name, skill]),
                ).values(),
            ),
        [project.roles],
    );

    return (
        <li
            data-project-id={project.id}
            data-test="project-row"
            className="min-w-0 rounded-3xl border border-border bg-card shadow-sm focus-within:border-primary/30 focus-within:shadow-md motion-safe:transition-[border-color,box-shadow] motion-safe:duration-standard motion-safe:ease-ledger"
        >
            <article className="flex h-full min-w-0 flex-col gap-5 p-5 sm:p-6">
                <div className="min-w-0 space-y-4">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="mr-auto flex size-11 items-center justify-center rounded-2xl border border-border bg-accent text-primary">
                            <BriefcaseBusiness
                                aria-hidden="true"
                                className="size-5"
                            />
                        </span>
                        <ProjectStatusBadge status={project.status} />
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                            <ShieldCheck
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            {displayVisibility(project.visibility)}
                        </span>
                    </div>

                    <div className="min-w-0 space-y-2">
                        <h3 className="text-xl leading-tight font-bold tracking-tight break-words sm:text-2xl">
                            <Link
                                href={projectShow(project.id)}
                                className="cursor-pointer wrap-anywhere text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-safe:transition-colors motion-safe:duration-standard"
                                data-test="project-detail-link"
                            >
                                {project.title}
                            </Link>
                        </h3>
                        {project.description && (
                            <p className="line-clamp-3 text-sm leading-6 wrap-anywhere text-muted-foreground">
                                {project.description}
                            </p>
                        )}
                    </div>

                    <div className="grid min-w-0 gap-4">
                        <div className="min-w-0 space-y-3 rounded-2xl bg-linear-to-br from-accent/80 to-background p-4">
                            <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                                <UsersRound
                                    aria-hidden="true"
                                    className="size-4 shrink-0"
                                />
                                Peran yang dibutuhkan
                            </p>
                            {project.roles.length > 0 ? (
                                <ul className="flex flex-wrap gap-2 text-sm">
                                    {project.roles.slice(0, 3).map((role) => (
                                        <li
                                            key={role.id}
                                            className="flex max-w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-white bg-card/80 px-3 py-2 text-foreground"
                                        >
                                            <span className="min-w-0 font-medium wrap-anywhere">
                                                {role.title}
                                            </span>
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {beginnerLabel(
                                                    role.accepts_beginners,
                                                )}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {capacityLabel(
                                                    role.capacity_stats,
                                                    role.capacity,
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                    {project.roles.length > 3 && (
                                        <li className="self-center text-xs text-muted-foreground">
                                            +{project.roles.length - 3} peran
                                            lainnya
                                        </li>
                                    )}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Rincian peran belum tersedia.
                                </p>
                            )}
                            {project.roles.length > 0 && (
                                <p className="text-xs leading-5 text-muted-foreground">
                                    Sisa peran tetap dibatasi kapasitas tim.
                                    Kriteria lengkap tersedia pada detail
                                    proyek.
                                </p>
                            )}
                        </div>

                        <div className="min-w-0 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">
                                Keahlian minimum
                            </p>
                            {skills.length > 0 ? (
                                <ul className="flex flex-wrap gap-1.5">
                                    {skills.slice(0, 3).map((skill) => (
                                        <li
                                            key={skill.name}
                                            className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-lg bg-background px-2.5 py-1.5 text-xs text-foreground"
                                        >
                                            <span className="min-w-0 wrap-anywhere">
                                                {skill.name}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {displayProficiency(
                                                    skill.proficiency,
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                    {skills.length > 3 && (
                                        <li className="self-center text-xs text-muted-foreground">
                                            +{skills.length - 3} keahlian
                                            lainnya
                                        </li>
                                    )}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Keahlian belum dirinci.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <dl className="mt-auto grid min-w-0 grid-cols-2 gap-3 border-t border-border/70 pt-4">
                    <div className="min-w-0 space-y-1">
                        <dt className="text-xs text-muted-foreground">
                            Batas waktu
                        </dt>
                        <dd className="flex min-w-0 items-start gap-2 text-sm font-medium">
                            <CalendarDays
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-primary"
                            />
                            <span className="break-words">
                                {formatDeadline(project.deadline)}
                            </span>
                        </dd>
                    </div>

                    <div className="min-w-0 space-y-1">
                        <dt className="text-xs text-muted-foreground">
                            Kapasitas tim
                        </dt>
                        <dd className="flex min-w-0 items-start gap-2 text-sm font-medium">
                            <UsersRound
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-primary"
                            />
                            <span className="break-words">
                                {capacityLabel(
                                    project.capacity_stats,
                                    project.capacity,
                                )}
                            </span>
                        </dd>
                    </div>

                    <div className="col-span-2 min-w-0 space-y-1 border-t border-border/60 pt-3">
                        <p className="mb-2 text-xs leading-5 text-muted-foreground">
                            {opportunityStatus(
                                project.capacity_stats,
                                project.status,
                                project.deadline,
                            )}
                        </p>
                        <dt className="text-xs text-muted-foreground">
                            Pemilik proyek
                        </dt>
                        <dd className="text-sm font-medium break-words">
                            {project.owner.name}
                        </dd>
                    </div>
                </dl>
                <Button
                    asChild
                    variant="outline"
                    className="min-h-11 w-full rounded-xl border-primary/25 bg-accent/30 text-primary hover:border-primary hover:bg-accent hover:text-primary motion-safe:transition-[background-color,border-color] motion-safe:duration-standard motion-safe:active:translate-y-0.5"
                >
                    <Link
                        href={projectShow(project.id)}
                        aria-label={`Lihat proyek ${project.title}`}
                    >
                        Lihat proyek{' '}
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                </Button>
            </article>
        </li>
    );
}

function ProjectLedgerSkeleton() {
    return (
        <li
            aria-hidden="true"
            data-test="project-skeleton-row"
            className="grid min-w-0 gap-5 rounded-3xl border border-border bg-card p-5 sm:p-6"
        >
            <div className="grid gap-5">
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-6 w-3/5 max-w-sm" />
                    <Skeleton className="h-4 w-full max-w-2xl" />
                    <Skeleton className="h-4 w-4/5 max-w-xl" />
                    <div className="grid gap-3 rounded-2xl bg-accent/50 p-4">
                        <Skeleton className="h-4 w-36" />
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-9 w-24 rounded-xl" />
                            <Skeleton className="h-9 w-28 rounded-xl" />
                        </div>
                        <Skeleton className="h-3 w-4/5" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-7 w-4/5 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-border/70 pt-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="col-span-2 h-4 w-36" />
                </div>
                <Skeleton className="h-11 w-full rounded-xl" />
            </div>
        </li>
    );
}

function ProjectEmptyState({
    onReset,
    isMine,
    onExplore,
}: {
    onReset: () => void;
    isMine: boolean;
    onExplore: () => void;
}) {
    return (
        <section
            data-test="projects-empty"
            className="grid justify-items-center gap-4 rounded-3xl border border-dashed border-border bg-linear-to-b from-card to-background px-5 py-10 text-center"
        >
            <ArchiveArt className="w-28" />
            <div className="grid max-w-lg gap-2">
                <h3 className="text-title font-semibold">
                    {isMine
                        ? 'Belum ada proyek saya yang cocok'
                        : 'Belum ada proyek yang cocok'}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                    {isMine
                        ? 'Proyek yang kamu kelola atau tim yang masih kamu ikuti akan muncul di sini. Coba atur ulang filter, atau temukan peluang untuk mulai bergabung.'
                        : 'Coba ubah kata pencarian atau longgarkan filter status dan visibilitas untuk melihat peluang kolaborasi lain.'}
                </p>
            </div>
            <Button
                type="button"
                variant="outline"
                onClick={onReset}
                data-test="projects-reset-empty"
            >
                Atur ulang filter
            </Button>
            {isMine && (
                <Button type="button" onClick={onExplore}>
                    Temukan peluang
                </Button>
            )}
        </section>
    );
}

function ProjectErrorState({
    onRetry,
    forbidden,
    processing,
}: {
    onRetry: () => void;
    forbidden: boolean;
    processing: boolean;
}) {
    return (
        <section
            role="alert"
            data-test="projects-error"
            className="flex flex-col gap-4 rounded-2xl border border-correction/40 bg-correction-subtle px-5 py-5 text-correction-subtle-foreground sm:flex-row sm:items-start sm:justify-between"
        >
            <div className="flex min-w-0 items-start gap-3">
                <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0"
                />
                <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold">
                        {forbidden
                            ? 'Daftar proyek tidak dapat diakses'
                            : 'Daftar proyek belum termuat'}
                    </h3>
                    <p className="text-sm leading-6">
                        {forbidden
                            ? 'Akses daftar proyek tidak tersedia untuk akunmu saat ini. Periksa afiliasi kampus atau coba muat ulang.'
                            : 'Filter tetap tersimpan. Coba muat ulang daftar proyek untuk melanjutkan.'}
                    </p>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                onClick={onRetry}
                disabled={processing}
                aria-busy={processing}
                className="shrink-0 border-correction/50 bg-transparent text-correction-subtle-foreground hover:bg-correction/10"
            >
                {processing ? 'Memuat ulang...' : 'Coba lagi'}
            </Button>
        </section>
    );
}

export default function ProjectIndex({
    institution,
    projects,
    filters,
    filter_options: filterOptions,
}: ProjectIndexProps) {
    const isMine = filters.view === 'mine';
    const lastQuery = useRef<QueryParams>({
        view: filters.view,
        institution_id: filters.institution_id,
    });
    const [searchQuery, setSearchQuery] = useState(filters.q);
    const [selectedStatuses, setSelectedStatuses] = useState(filters.status);
    const [selectedVisibilities, setSelectedVisibilities] = useState(
        filters.visibility,
    );
    const [selectedSort, setSelectedSort] = useState(filters.sort);
    const [selectedDirection, setSelectedDirection] = useState(
        filters.direction,
    );
    const [selectedPerPage, setSelectedPerPage] = useState(filters.per_page);
    const [selectedBeginner, setSelectedBeginner] = useState(
        filters.beginner ?? 'all',
    );
    const [selectedAvailability, setSelectedAvailability] = useState(
        filters.availability ?? 'all',
    );
    const [isPending, setIsPending] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isForbidden, setIsForbidden] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setSearchQuery(filters.q);
            setSelectedStatuses(filters.status);
            setSelectedVisibilities(filters.visibility);
            setSelectedSort(filters.sort);
            setSelectedDirection(filters.direction);
            setSelectedPerPage(filters.per_page);
            setSelectedBeginner(filters.beginner ?? 'all');
            setSelectedAvailability(filters.availability ?? 'all');
        });

        return () => cancelAnimationFrame(frame);
    }, [
        filters.direction,
        filters.beginner,
        filters.availability,
        filters.institution_id,
        filters.per_page,
        filters.q,
        filters.sort,
        filters.status,
        filters.view,
        filters.visibility,
    ]);

    const queryForPage = (page: number, applied = false): QueryParams => ({
        view: filters.view,
        q: (applied ? filters.q : searchQuery).trim() || undefined,
        beginner: applied ? filters.beginner : selectedBeginner,
        availability: applied ? filters.availability : selectedAvailability,
        status: (applied ? filters.status : selectedStatuses).join(','),
        visibility: (applied ? filters.visibility : selectedVisibilities).join(
            ',',
        ),
        sort: applied ? filters.sort : selectedSort,
        direction: applied ? filters.direction : selectedDirection,
        institution_id: filters.institution_id,
        per_page: applied ? filters.per_page : selectedPerPage,
        page: page > 1 ? page : undefined,
    });

    const handleDiscoveryFailure = (forbidden = false): false => {
        setHasError(true);
        setIsForbidden((current) => current || forbidden);
        setIsPending(false);

        return false;
    };

    const visitQuery = (query: QueryParams, preserveScroll = false): void => {
        lastQuery.current = query;
        setIsPending(true);

        router.visit(projectsIndex({ query }), {
            preserveScroll,
            preserveState: true,
            replace: true,
            onSuccess: () => {
                setHasError(false);
                setIsForbidden(false);
            },
            onError: () => setHasError(true),
            onHttpException: (response) =>
                handleDiscoveryFailure(response.status === 403),
            onNetworkError: () => handleDiscoveryFailure(),
            onFinish: () => setIsPending(false),
        });
    };

    const visitDiscovery = (page = 1, applied = false): void =>
        visitQuery(queryForPage(page, applied), page > 1);
    const changeView = (view: DiscoveryFilters['view']): void => {
        if (view !== filters.view) {
            visitQuery({ view, institution_id: filters.institution_id });
        }
    };

    const resetFilters = (): void => {
        visitQuery({
            view: filters.view,
            institution_id: filters.institution_id,
        });
    };

    const toggleStatus = (status: string, checked: boolean): void => {
        if (!checked && selectedStatuses.length === 1) {
            return;
        }

        setSelectedStatuses((current) =>
            checked
                ? Array.from(new Set([...current, status]))
                : current.filter((value) => value !== status),
        );
    };

    const toggleVisibility = (visibility: string, checked: boolean): void => {
        if (!checked && selectedVisibilities.length === 1) {
            return;
        }

        setSelectedVisibilities((current) =>
            checked
                ? Array.from(new Set([...current, visibility]))
                : current.filter((value) => value !== visibility),
        );
    };

    const resultSummary = isPending
        ? 'Memuat ulang daftar proyek.'
        : hasError
          ? 'Hasil belum dapat ditampilkan. Coba lagi untuk memeriksa akses dan data terbaru.'
          : projects.meta.total === 0
            ? 'Tidak ada proyek yang cocok dengan filter saat ini.'
            : `${projects.meta.from} sampai ${projects.meta.to} dari ${projects.meta.total} proyek.`;

    return (
        <>
            <Head title={isMine ? 'Proyek saya' : 'Temukan proyek'} />
            <AppPage className="min-w-0">
                <div
                    data-test="projects-root"
                    className="w-full min-w-0 space-y-6"
                >
                    <header
                        className="relative overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent via-sky-100 to-blue-100 p-5 shadow-md sm:p-7"
                        data-test="project-discovery-header"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-24 -right-12 size-80 rounded-full border border-white/70 bg-white/30"
                        />
                        <ArchiveArt className="absolute top-5 right-28 hidden w-36 -rotate-6 opacity-55 sm:block lg:right-36 lg:w-44" />
                        <span
                            aria-hidden="true"
                            className="absolute top-7 right-7 h-1.5 w-10 -rotate-12 rounded-full bg-satu-feather/70"
                        />
                        <div className="relative flex items-center justify-between gap-4">
                            <div className="max-w-2xl min-w-0">
                                <p className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary">
                                    <BriefcaseBusiness
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    {isMine
                                        ? 'Pekerjaan bersama tim'
                                        : 'Peluang kolaborasi'}
                                </p>
                                <h1 className="mt-4 text-2xl leading-snug font-bold tracking-tight text-foreground sm:text-3xl">
                                    {isMine
                                        ? 'Lanjutkan proyek dan pekerjaanmu.'
                                        : 'Temukan tim untuk ide dan keahlianmu.'}
                                </h1>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    {isMine
                                        ? 'Temukan proyek yang kamu kelola dan tim yang masih kamu ikuti, termasuk draft milikmu. Buka proyek untuk melanjutkan pekerjaan.'
                                        : 'Jelajahi proyek, kenali kebutuhan tim, dan pilih peluang yang ingin kamu kerjakan bersama.'}
                                </p>
                            </div>
                            <Mascot
                                pose="guide"
                                className="hidden w-32 shrink-0 sm:block lg:w-40"
                            />
                        </div>
                        <div className="relative mt-5 flex flex-col gap-4 border-t border-white/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="flex min-w-0 items-start gap-2 text-sm font-medium text-foreground">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-primary"
                                />
                                <span className="min-w-0 wrap-anywhere">
                                    {institution.name}
                                </span>
                            </p>
                            <Button
                                asChild
                                className="min-h-11 w-full shrink-0 rounded-xl shadow-sm hover:bg-primary sm:w-auto dark:hover:bg-primary"
                                data-test="create-project-link"
                            >
                                <Link
                                    href={projectsCreate({
                                        query: {
                                            institution_id: institution.id,
                                        },
                                    })}
                                >
                                    <Plus
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Buat proyek
                                </Link>
                            </Button>
                        </div>
                    </header>

                    <div className="rounded-2xl border border-primary/15 bg-white px-5 py-4 text-sm leading-6 shadow-sm">
                        <p>
                            Belum menemukan peran yang sesuai? Bantuan kampus
                            bersifat pilihan, bukan syarat mengajukan minat.
                        </p>
                        <Button
                            variant="link"
                            className="mt-1 min-h-11 px-0"
                            asChild
                        >
                            <Link href={opportunitySupport(institution.id)}>
                                Bantuan kesempatan
                            </Link>
                        </Button>
                    </div>
                    <nav
                        aria-label="Tampilan proyek"
                        className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/15 bg-card p-2 shadow-sm"
                        data-test="project-views"
                    >
                        <Button
                            type="button"
                            variant={isMine ? 'ghost' : 'default'}
                            disabled={isPending}
                            aria-pressed={!isMine}
                            onClick={() => changeView('opportunities')}
                            className="min-h-11 flex-1 sm:flex-none"
                        >
                            Peluang
                        </Button>
                        <Button
                            type="button"
                            variant={isMine ? 'default' : 'ghost'}
                            disabled={isPending}
                            aria-pressed={isMine}
                            onClick={() => changeView('mine')}
                            className="min-h-11 flex-1 sm:flex-none"
                        >
                            Proyek saya
                        </Button>
                        <p className="basis-full px-3 py-1 text-xs leading-5 text-muted-foreground sm:basis-auto">
                            {isMine
                                ? 'Proyek milikmu atau dengan keanggotaan tim aktif.'
                                : 'Pahami kebutuhan peran sebelum mengajukan bergabung.'}
                        </p>
                    </nav>
                    <section
                        aria-labelledby="project-filters-title"
                        data-test="project-filters"
                        className="min-w-0 rounded-3xl border border-primary/20 bg-card shadow-md"
                    >
                        <form
                            className="grid gap-5 p-5 sm:p-6"
                            onSubmit={(event) => {
                                event.preventDefault();
                                visitDiscovery();
                            }}
                        >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                        <div>
                                            <p className="text-xs font-bold tracking-[0.13em] text-primary uppercase">
                                                Temukan peluang
                                            </p>
                                            <h2
                                                id="project-filters-title"
                                                className="mt-1 text-title font-bold tracking-[-0.02em] text-foreground"
                                            >
                                                Cari proyek yang sesuai
                                            </h2>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Filter tersimpan di URL
                                        </p>
                                    </div>
                                    <div className="relative mt-4">
                                        <Search
                                            aria-hidden="true"
                                            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
                                        />
                                        <Input
                                            id="project-search"
                                            value={searchQuery}
                                            onChange={(event) =>
                                                setSearchQuery(
                                                    event.target.value,
                                                )
                                            }
                                            aria-label="Cari proyek berdasarkan judul, peran, atau keahlian"
                                            placeholder="Cari judul, peran, atau keahlian"
                                            className="h-12 min-w-0 border-input bg-background/60 pl-11 text-base shadow-none hover:border-ring"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="h-12 w-full shrink-0 px-5 lg:w-auto"
                                    data-test="project-apply-filters"
                                >
                                    <Filter aria-hidden="true" />
                                    Terapkan filter
                                </Button>
                            </div>

                            <details
                                className="min-w-0 border-t border-border/60 pt-4"
                                data-test="project-advanced-filters"
                            >
                                <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-2 rounded-xl px-3 text-sm font-semibold text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:transition-colors motion-safe:duration-standard [&::-webkit-details-marker]:hidden">
                                    <Filter
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Filter tambahan
                                    <ChevronRight
                                        aria-hidden="true"
                                        className="ml-auto size-4 in-open:rotate-90 motion-safe:transition-transform motion-safe:duration-standard"
                                    />
                                </summary>
                                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                                    <div className="min-w-0 space-y-2">
                                        <Label htmlFor="project-beginner-filter">
                                            Penerimaan pemula
                                        </Label>
                                        <select
                                            id="project-beginner-filter"
                                            className={selectClassName}
                                            value={selectedBeginner}
                                            disabled={isPending}
                                            onChange={(event) =>
                                                setSelectedBeginner(
                                                    event.target.value as
                                                        'all' | 'accepting',
                                                )
                                            }
                                            aria-describedby="project-beginner-help"
                                        >
                                            <option value="all">
                                                Semua peran
                                            </option>
                                            <option value="accepting">
                                                Menerima pemula
                                            </option>
                                        </select>
                                        <p
                                            id="project-beginner-help"
                                            className="text-xs leading-5 text-muted-foreground"
                                        >
                                            Mengikuti pernyataan pemilik. Bukan
                                            jaminan diterima dan tidak
                                            mensyaratkan karya terdahulu.
                                        </p>
                                    </div>
                                    <div className="min-w-0 space-y-2">
                                        <Label htmlFor="project-availability-filter">
                                            Tempat tersedia
                                        </Label>
                                        <select
                                            id="project-availability-filter"
                                            className={selectClassName}
                                            value={selectedAvailability}
                                            disabled={isPending}
                                            onChange={(event) =>
                                                setSelectedAvailability(
                                                    event.target.value as
                                                        'all' | 'available',
                                                )
                                            }
                                            aria-describedby="project-availability-help"
                                        >
                                            <option value="all">
                                                Semua keadaan
                                            </option>
                                            <option value="available">
                                                Masih menerima pengajuan
                                            </option>
                                        </select>
                                        <p
                                            id="project-availability-help"
                                            className="text-xs leading-5 text-muted-foreground"
                                        >
                                            Tenggat belum lewat dan ada tempat
                                            pada tim serta peran. Pengajuan
                                            pending tidak memesan tempat.
                                        </p>
                                    </div>
                                    <fieldset className="min-w-0 space-y-3">
                                        <legend className="text-xs font-bold tracking-[0.13em] text-muted-foreground uppercase">
                                            Status proyek
                                        </legend>
                                        <div className="flex flex-wrap gap-2">
                                            {filterOptions.status.map(
                                                (status) => (
                                                    <div
                                                        key={status}
                                                        className={cn(
                                                            'flex min-h-11 max-w-full items-center gap-2 rounded-xl border px-3 py-1 text-sm transition-colors duration-fast motion-reduce:transition-none',
                                                            selectedStatuses.includes(
                                                                status,
                                                            )
                                                                ? 'border-primary/30 bg-accent text-primary'
                                                                : 'border-border bg-card text-muted-foreground',
                                                        )}
                                                    >
                                                        <Checkbox
                                                            id={`status-${status}`}
                                                            checked={selectedStatuses.includes(
                                                                status,
                                                            )}
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                toggleStatus(
                                                                    status,
                                                                    checked ===
                                                                        true,
                                                                )
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={`status-${status}`}
                                                            className="flex min-h-11 min-w-0 cursor-pointer items-center text-sm font-medium wrap-anywhere"
                                                        >
                                                            {displayStatus(
                                                                status,
                                                            )}
                                                        </Label>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <p className="text-xs leading-5 text-muted-foreground">
                                            Pilih minimal satu status.
                                        </p>
                                    </fieldset>

                                    <fieldset className="min-w-0 space-y-3">
                                        <legend className="text-xs font-bold tracking-[0.13em] text-muted-foreground uppercase">
                                            Visibilitas
                                        </legend>
                                        <div className="flex flex-wrap gap-2">
                                            {filterOptions.visibility.map(
                                                (visibility) => (
                                                    <div
                                                        key={visibility}
                                                        className={cn(
                                                            'flex min-h-11 max-w-full items-center gap-2 rounded-xl border px-3 py-1 text-sm transition-colors duration-fast motion-reduce:transition-none',
                                                            selectedVisibilities.includes(
                                                                visibility,
                                                            )
                                                                ? 'border-primary/30 bg-accent text-primary'
                                                                : 'border-border bg-card text-muted-foreground',
                                                        )}
                                                    >
                                                        <Checkbox
                                                            id={`visibility-${visibility}`}
                                                            checked={selectedVisibilities.includes(
                                                                visibility,
                                                            )}
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                toggleVisibility(
                                                                    visibility,
                                                                    checked ===
                                                                        true,
                                                                )
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={`visibility-${visibility}`}
                                                            className="flex min-h-11 min-w-0 cursor-pointer items-center text-sm font-medium wrap-anywhere"
                                                        >
                                                            {displayVisibility(
                                                                visibility,
                                                            )}
                                                        </Label>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <p className="text-xs leading-5 text-muted-foreground">
                                            Proyek pribadi hanya muncul jika
                                            kamu pemiliknya.
                                        </p>
                                    </fieldset>
                                </div>

                                <div className="grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-3">
                                    <div className="min-w-0 space-y-2">
                                        <Label
                                            htmlFor="project-sort"
                                            className="text-xs font-bold tracking-[0.13em] text-muted-foreground uppercase"
                                        >
                                            Urutkan berdasarkan
                                        </Label>
                                        <select
                                            id="project-sort"
                                            className={selectClassName}
                                            value={selectedSort}
                                            onChange={(event) =>
                                                setSelectedSort(
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            {filterOptions.sort.map((sort) => (
                                                <option key={sort} value={sort}>
                                                    {sort === 'deadline'
                                                        ? 'Batas waktu'
                                                        : sort === 'newest'
                                                          ? 'Proyek terbaru'
                                                          : sort === 'title'
                                                            ? 'Judul proyek'
                                                            : sort}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="min-w-0 space-y-2">
                                        <Label
                                            htmlFor="project-direction"
                                            className="text-xs font-bold tracking-[0.13em] text-muted-foreground uppercase"
                                        >
                                            Arah urutan
                                        </Label>
                                        <select
                                            id="project-direction"
                                            className={selectClassName}
                                            value={selectedDirection}
                                            onChange={(event) =>
                                                setSelectedDirection(
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            {filterOptions.direction.map(
                                                (direction) => (
                                                    <option
                                                        key={direction}
                                                        value={direction}
                                                    >
                                                        {direction === 'asc'
                                                            ? 'Naik'
                                                            : 'Turun'}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                    <div className="min-w-0 space-y-2">
                                        <Label
                                            htmlFor="project-per-page"
                                            className="text-xs font-bold tracking-[0.13em] text-muted-foreground uppercase"
                                        >
                                            Hasil per halaman
                                        </Label>
                                        <select
                                            id="project-per-page"
                                            className={selectClassName}
                                            value={selectedPerPage}
                                            onChange={(event) =>
                                                setSelectedPerPage(
                                                    Number(event.target.value),
                                                )
                                            }
                                        >
                                            {Array.from(
                                                new Set([
                                                    filterOptions.per_page
                                                        .default,
                                                    filters.per_page,
                                                    10,
                                                    20,
                                                    50,
                                                ]),
                                            )
                                                .filter(
                                                    (amount) =>
                                                        amount <=
                                                        filterOptions.per_page
                                                            .max,
                                                )
                                                .map((amount) => (
                                                    <option
                                                        key={amount}
                                                        value={amount}
                                                    >
                                                        {amount} proyek
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={resetFilters}
                                    disabled={isPending}
                                    className="mt-4 min-h-11 w-full text-muted-foreground sm:w-auto"
                                >
                                    Atur ulang filter
                                </Button>
                            </details>
                            <div
                                className="flex min-w-0 flex-wrap items-center gap-2 border-t border-border/60 pt-4"
                                aria-label="Filter yang diterapkan"
                                data-test="project-applied-filters"
                            >
                                <span className="text-xs text-muted-foreground">
                                    Diterapkan:
                                </span>
                                {filters.q && (
                                    <span className="max-w-full rounded-lg bg-background px-2.5 py-1.5 text-xs wrap-anywhere text-foreground">
                                        Pencarian: {filters.q}
                                    </span>
                                )}
                                {filters.beginner === 'accepting' && (
                                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
                                        Menerima pemula
                                    </span>
                                )}
                                {filters.availability === 'available' && (
                                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
                                        Masih menerima pengajuan
                                    </span>
                                )}
                                {filters.status.map((value) => (
                                    <span
                                        key={value}
                                        className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-primary"
                                    >
                                        {displayStatus(value)}
                                    </span>
                                ))}
                                {filters.visibility.map((value) => (
                                    <span
                                        key={value}
                                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground"
                                    >
                                        {displayVisibility(value)}
                                    </span>
                                ))}
                            </div>
                        </form>
                    </section>

                    <section
                        aria-labelledby="project-results-title"
                        aria-busy={isPending}
                        data-test="projects-results"
                        className="min-w-0 space-y-4"
                    >
                        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0 space-y-1">
                                <p className="text-xs font-bold tracking-[0.13em] text-primary uppercase">
                                    {isMine
                                        ? 'Pekerjaan dan arsip saya'
                                        : 'Daftar peluang'}
                                </p>
                                <h2
                                    id="project-results-title"
                                    className="text-title font-bold tracking-[-0.02em] text-foreground"
                                >
                                    {isMine ? 'Proyek saya' : 'Peluang proyek'}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {isMine ? 'Pekerjaan' : 'Peluang'} dalam
                                    konteks {institution.name}.
                                </p>
                            </div>
                            <div
                                role="status"
                                aria-live="polite"
                                className="max-w-full rounded-full border border-border bg-accent px-3 py-1.5 text-sm font-medium wrap-anywhere text-primary"
                            >
                                {resultSummary}
                            </div>
                        </div>

                        {hasError && (
                            <ProjectErrorState
                                onRetry={() => visitQuery(lastQuery.current)}
                                forbidden={isForbidden}
                                processing={isPending}
                            />
                        )}

                        {isPending && (
                            <div
                                data-test="projects-refresh-skeleton"
                                className="min-w-0"
                                role="status"
                                aria-live="polite"
                            >
                                <p className="sr-only">
                                    Memuat proyek terbaru.
                                </p>
                                <ul
                                    aria-hidden="true"
                                    className="grid min-w-0 gap-5 xl:grid-cols-2"
                                >
                                    <ProjectLedgerSkeleton />
                                </ul>
                            </div>
                        )}

                        {!hasError &&
                            projects.data.length === 0 &&
                            !isPending && (
                                <ProjectEmptyState
                                    onReset={resetFilters}
                                    isMine={isMine}
                                    onExplore={() =>
                                        changeView('opportunities')
                                    }
                                />
                            )}

                        {!hasError && projects.data.length > 0 && (
                            <ul
                                data-test="project-ledger"
                                className="grid min-w-0 gap-5 xl:grid-cols-2"
                            >
                                {projects.data.map((project) => (
                                    <ProjectLedgerRow
                                        key={project.id}
                                        project={project}
                                    />
                                ))}
                            </ul>
                        )}

                        {!hasError && projects.meta.last_page > 1 && (
                            <nav
                                aria-label="Navigasi halaman proyek"
                                data-test="project-pagination"
                                className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <p className="text-sm text-muted-foreground">
                                    Halaman {projects.meta.current_page} dari{' '}
                                    {projects.meta.last_page}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            isPending ||
                                            projects.meta.current_page <= 1
                                        }
                                        onClick={() =>
                                            visitDiscovery(
                                                projects.meta.current_page - 1,
                                                true,
                                            )
                                        }
                                        aria-label="Halaman sebelumnya"
                                        className="min-h-11"
                                    >
                                        <ChevronLeft aria-hidden="true" />
                                        Sebelumnya
                                    </Button>
                                    {pageNumbers(
                                        projects.meta.current_page,
                                        projects.meta.last_page,
                                    ).map((page) => (
                                        <Button
                                            key={page}
                                            type="button"
                                            size="sm"
                                            variant={
                                                page ===
                                                projects.meta.current_page
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            disabled={isPending}
                                            aria-current={
                                                page ===
                                                projects.meta.current_page
                                                    ? 'page'
                                                    : undefined
                                            }
                                            aria-label={`Buka halaman ${page}`}
                                            onClick={() =>
                                                visitDiscovery(page, true)
                                            }
                                            className="min-h-11 min-w-11"
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            isPending ||
                                            projects.meta.current_page >=
                                                projects.meta.last_page
                                        }
                                        onClick={() =>
                                            visitDiscovery(
                                                projects.meta.current_page + 1,
                                                true,
                                            )
                                        }
                                        aria-label="Halaman berikutnya"
                                        className="min-h-11"
                                    >
                                        Berikutnya
                                        <ChevronRight aria-hidden="true" />
                                    </Button>
                                </div>
                            </nav>
                        )}
                    </section>
                </div>
            </AppPage>
        </>
    );
}

ProjectIndex.layout = {
    breadcrumbs: [
        {
            title: 'Penemuan proyek',
            href: projectsIndex(),
        },
    ],
};
