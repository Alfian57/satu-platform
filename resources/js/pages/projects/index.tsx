import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Circle,
    CircleDot,
    CircleX,
    Clock3,
    Filter,
    FolderSearch,
    Plus,
    Search,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppPage } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    create as projectsCreate,
    index as projectsIndex,
    show as projectShow,
} from '@/routes/projects';
import type { QueryParams } from '@/wayfinder';

/**
 * THESIS: Project discovery is an opportunity register, not a card gallery.
 * OWN-WORLD: Ruled ledger rows, indexed controls, restrained institutional blue, and status marks.
 * STORY: A student sees which project needs help, what it requires, and when to act.
 * FIRST VIEWPORT: Context and search lead into filters, then the first result rows and their facts.
 * FORM: Operate surface using a dense ledger list, with URL filters and progressive loading states.
 */

type ProjectStatus = 'open' | 'forming' | 'full' | 'closed' | 'cancelled';
type ProjectVisibility = 'private' | 'institution' | 'public';

type ProjectRole = {
    id: number;
    title: string;
    description: string | null;
    capacity: number;
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
    open: 'Terbuka',
    forming: 'Membentuk tim',
    full: 'Kapasitas penuh',
    closed: 'Ditutup',
    cancelled: 'Dibatalkan',
};

const visibilityLabels: Record<ProjectVisibility, string> = {
    private: 'Pribadi milikmu',
    institution: 'Kampus',
    public: 'Publik',
};

const statusIcons: Record<ProjectStatus, LucideIcon> = {
    open: CheckCircle2,
    forming: Clock3,
    full: UsersRound,
    closed: Circle,
    cancelled: CircleX,
};

const statusClasses: Record<ProjectStatus, string> = {
    open: 'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
    forming:
        'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    full: 'border-border bg-muted text-muted-foreground',
    closed: 'border-border bg-muted text-muted-foreground',
    cancelled:
        'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
};

const selectClassName =
    'h-control-md w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50';

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
    return proficiency.charAt(0).toUpperCase() + proficiency.slice(1);
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

function formatCapacity(capacity: number): string {
    return `${capacity} orang`;
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
            className="min-w-0 border-b border-border/80 first:border-t"
        >
            <article className="grid min-w-0 gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.42fr)] lg:gap-8">
                <div className="min-w-0 space-y-4">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="font-label text-label text-muted-foreground">
                            PROJECT {String(project.id).padStart(4, '0')}
                        </span>
                        <ProjectStatusBadge status={project.status} />
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                            <ShieldCheck
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            {displayVisibility(project.visibility)}
                        </span>
                    </div>

                    <div className="min-w-0 space-y-2">
                        <h3 className="text-title font-semibold break-words">
                            <Link
                                href={projectShow(project.id)}
                                className="cursor-pointer underline-offset-4 hover:underline"
                                data-test="project-detail-link"
                            >
                                {project.title}
                            </Link>
                        </h3>
                        {project.description && (
                            <p className="max-w-[75ch] text-sm leading-6 break-words whitespace-pre-line text-muted-foreground">
                                {project.description}
                            </p>
                        )}
                    </div>

                    <div className="grid min-w-0 gap-4 border-t border-border/70 pt-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                        <div className="min-w-0 space-y-2">
                            <p className="font-label text-label text-muted-foreground">
                                PERAN YANG DIBUTUHKAN
                            </p>
                            {project.roles.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                    {project.roles.map((role) => (
                                        <li
                                            key={role.id}
                                            className="flex min-w-0 items-start justify-between gap-3"
                                        >
                                            <span className="min-w-0 font-medium break-words">
                                                {role.title}
                                            </span>
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {role.capacity} slot
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Rincian peran belum tersedia.
                                </p>
                            )}
                        </div>

                        <div className="min-w-0 space-y-2">
                            <p className="font-label text-label text-muted-foreground">
                                SKILL YANG DIBUTUHKAN
                            </p>
                            {skills.length > 0 ? (
                                <ul className="flex flex-wrap gap-1.5">
                                    {skills.map((skill) => (
                                        <li
                                            key={skill.name}
                                            className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border bg-muted/60 px-2 py-1 text-xs text-foreground"
                                        >
                                            <span className="break-words">
                                                {skill.name}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {displayProficiency(
                                                    skill.proficiency,
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Skill belum dirinci.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <dl className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-4 border-t border-border/70 pt-4 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                    <div className="min-w-0 space-y-1">
                        <dt className="font-label text-label text-muted-foreground">
                            DEADLINE
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
                        <dt className="font-label text-label text-muted-foreground">
                            KAPASITAS TIM
                        </dt>
                        <dd className="flex min-w-0 items-start gap-2 text-sm font-medium">
                            <UsersRound
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-primary"
                            />
                            <span className="break-words">
                                {formatCapacity(project.capacity)}
                            </span>
                        </dd>
                    </div>

                    <div className="col-span-2 min-w-0 space-y-1 border-t border-border/70 pt-4 lg:col-span-1">
                        <dt className="font-label text-label text-muted-foreground">
                            PEMILIK PROJECT
                        </dt>
                        <dd className="text-sm font-medium break-words">
                            {project.owner.name}
                        </dd>
                    </div>
                </dl>
            </article>
        </li>
    );
}

function ProjectLedgerSkeleton() {
    return (
        <li
            aria-hidden="true"
            data-test="project-skeleton-row"
            className="border-b border-border/80 py-6 first:border-t"
        >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.42fr)] lg:gap-8">
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-6 w-3/5 max-w-sm" />
                    <Skeleton className="h-4 w-full max-w-2xl" />
                    <Skeleton className="h-4 w-4/5 max-w-xl" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-border/70 pt-4 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="col-span-2 h-4 w-36 lg:col-span-1" />
                </div>
            </div>
        </li>
    );
}

function ProjectEmptyState({ onReset }: { onReset: () => void }) {
    return (
        <section
            data-test="projects-empty"
            className="grid justify-items-center gap-4 border-y border-border/80 bg-card/50 px-6 py-14 text-center"
        >
            <div className="grid size-12 place-items-center rounded-md border border-border bg-muted text-primary">
                <FolderSearch aria-hidden="true" className="size-6" />
            </div>
            <div className="grid max-w-lg gap-2">
                <h3 className="text-title font-semibold">
                    Belum ada project yang cocok
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                    Coba ubah kata pencarian atau longgarkan filter status dan
                    visibilitas untuk melihat peluang kolaborasi lain.
                </p>
            </div>
            <Button
                type="button"
                variant="outline"
                onClick={onReset}
                data-test="projects-reset-empty"
            >
                Hapus semua filter
            </Button>
        </section>
    );
}

function ProjectErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <section
            role="alert"
            data-test="projects-error"
            className="flex flex-col gap-4 border border-correction/40 bg-correction-subtle px-5 py-5 text-correction-subtle-foreground sm:flex-row sm:items-start sm:justify-between"
        >
            <div className="flex min-w-0 items-start gap-3">
                <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0"
                />
                <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold">
                        Daftar project belum termuat
                    </h3>
                    <p className="text-sm leading-6">
                        Filter tetap tersimpan. Coba muat ulang daftar project
                        untuk melanjutkan.
                    </p>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                onClick={onRetry}
                className="shrink-0 border-correction/50 bg-transparent text-correction-subtle-foreground hover:bg-correction/10"
            >
                Coba lagi
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
    const [isPending, setIsPending] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const handleVisitFailure = (): void => {
            setHasError(true);
            setIsPending(false);
        };
        const removeNetworkErrorListener = router.on(
            'networkError',
            handleVisitFailure,
        );
        const removeHttpExceptionListener = router.on(
            'httpException',
            handleVisitFailure,
        );

        return () => {
            removeNetworkErrorListener();
            removeHttpExceptionListener();
        };
    }, []);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setSearchQuery(filters.q);
            setSelectedStatuses(filters.status);
            setSelectedVisibilities(filters.visibility);
            setSelectedSort(filters.sort);
            setSelectedDirection(filters.direction);
            setSelectedPerPage(filters.per_page);
        });

        return () => cancelAnimationFrame(frame);
    }, [
        filters.direction,
        filters.institution_id,
        filters.per_page,
        filters.q,
        filters.sort,
        filters.status,
        filters.visibility,
    ]);

    const queryForPage = (page: number): QueryParams => ({
        q: searchQuery.trim() || undefined,
        status: selectedStatuses.join(','),
        visibility: selectedVisibilities.join(','),
        sort: selectedSort,
        direction: selectedDirection,
        institution_id: filters.institution_id,
        per_page: selectedPerPage,
        page: page > 1 ? page : undefined,
    });

    const visitDiscovery = (page: number = 1): void => {
        setHasError(false);
        setIsPending(true);

        router.visit(projectsIndex({ query: queryForPage(page) }), {
            preserveScroll: page > 1,
            preserveState: true,
            replace: true,
            onSuccess: () => setHasError(false),
            onError: () => setHasError(true),
            onFinish: () => setIsPending(false),
        });
    };

    const resetFilters = (): void => {
        setSearchQuery('');
        setSelectedStatuses(filterOptions.status.slice(0, 3));
        setSelectedVisibilities(
            filterOptions.visibility.filter((visibility) =>
                ['institution', 'public'].includes(visibility),
            ),
        );
        setSelectedSort('deadline');
        setSelectedDirection('asc');
        setSelectedPerPage(filterOptions.per_page.default);
        setHasError(false);
        setIsPending(true);

        router.visit(projectsIndex(), {
            preserveScroll: false,
            preserveState: false,
            replace: true,
            onFinish: () => setIsPending(false),
            onError: () => setHasError(true),
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
        ? 'Memuat ulang daftar project.'
        : projects.meta.total === 0
          ? 'Tidak ada project yang cocok dengan filter saat ini.'
          : `${projects.meta.from} sampai ${projects.meta.to} dari ${projects.meta.total} project.`;

    return (
        <>
            <Head title="Temukan project" />
            <AppPage className="min-w-0">
                <div
                    data-test="projects-root"
                    className="mx-auto max-w-7xl min-w-0 space-y-7"
                >
                    <header className="grid gap-5 border-b border-border pb-6 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,0.34fr)] xl:items-end xl:gap-10">
                        <div className="min-w-0 space-y-3">
                            <p className="font-label text-label text-primary">
                                INDEX PROJECT / {institution.name}
                            </p>
                            <h1 className="max-w-[24ch] text-headline font-bold text-balance">
                                Temukan project yang bisa kamu kerjakan bersama.
                            </h1>
                            <p className="max-w-[68ch] text-body text-muted-foreground">
                                Jelajahi kebutuhan peran, skill, kapasitas, dan
                                deadline dalam satu daftar yang bisa dibagikan
                                melalui URL.
                            </p>
                        </div>

                        <div className="grid gap-2 border border-border bg-card/60 px-4 py-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-verified"
                                />
                                <span className="font-label text-label">
                                    KONTEKS TERPILIH
                                </span>
                            </div>
                            <p className="font-semibold break-words">
                                {institution.name}
                            </p>
                            <p className="text-xs leading-5 text-muted-foreground">
                                Daftar ini mengikuti afiliasi kampus yang sedang
                                aktif pada akunmu.
                            </p>
                            <Button
                                asChild
                                className="mt-2 w-full cursor-pointer"
                                data-test="create-project-link"
                            >
                                <Link
                                    href={projectsCreate({
                                        query: {
                                            institution_id: institution.id,
                                        },
                                    })}
                                >
                                    <Plus aria-hidden="true" />
                                    Buat project baru
                                </Link>
                            </Button>
                        </div>
                    </header>

                    <section
                        aria-labelledby="project-filters-title"
                        data-test="project-filters"
                        className="border-y border-border bg-card/40"
                    >
                        <form
                            className="grid gap-6 p-4 md:p-6"
                            onSubmit={(event) => {
                                event.preventDefault();
                                visitDiscovery();
                            }}
                        >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Label
                                        htmlFor="project-search"
                                        id="project-filters-title"
                                        className="font-label text-label text-muted-foreground"
                                    >
                                        CARI PROJECT
                                    </Label>
                                    <div className="relative">
                                        <Search
                                            aria-hidden="true"
                                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                        />
                                        <Input
                                            id="project-search"
                                            value={searchQuery}
                                            onChange={(event) =>
                                                setSearchQuery(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Cari judul, deskripsi, peran, atau skill"
                                            className="pl-10"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full shrink-0 lg:w-auto"
                                    data-test="project-apply-filters"
                                >
                                    <Filter aria-hidden="true" />
                                    Terapkan filter
                                </Button>
                            </div>

                            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <fieldset className="min-w-0 space-y-3">
                                        <legend className="font-label text-label text-muted-foreground">
                                            STATUS PROJECT
                                        </legend>
                                        <div className="flex flex-wrap gap-x-5 gap-y-3">
                                            {filterOptions.status.map(
                                                (status) => (
                                                    <div
                                                        key={status}
                                                        className="flex min-h-10 items-center gap-2 text-sm"
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
                                                            className="cursor-pointer"
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
                                        <legend className="font-label text-label text-muted-foreground">
                                            VISIBILITAS
                                        </legend>
                                        <div className="flex flex-wrap gap-x-5 gap-y-3">
                                            {filterOptions.visibility.map(
                                                (visibility) => (
                                                    <div
                                                        key={visibility}
                                                        className="flex min-h-10 items-center gap-2 text-sm"
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
                                                            className="cursor-pointer"
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
                                            Project pribadi hanya muncul jika
                                            kamu pemiliknya.
                                        </p>
                                    </fieldset>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                                    <div className="min-w-0 space-y-2">
                                        <Label
                                            htmlFor="project-sort"
                                            className="font-label text-label text-muted-foreground"
                                        >
                                            URUTKAN BERDASARKAN
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
                                                        ? 'Deadline'
                                                        : sort === 'newest'
                                                          ? 'Project terbaru'
                                                          : sort === 'title'
                                                            ? 'Judul project'
                                                            : sort}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="min-w-0 space-y-2">
                                        <Label
                                            htmlFor="project-direction"
                                            className="font-label text-label text-muted-foreground"
                                        >
                                            ARAH URUTAN
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
                                            className="font-label text-label text-muted-foreground"
                                        >
                                            HASIL PER HALAMAN
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
                                            {[10, 20, 50]
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
                                                        {amount} project
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </section>

                    <section
                        aria-labelledby="project-results-title"
                        aria-busy={isPending}
                        data-test="projects-results"
                        className="min-w-0 space-y-4"
                    >
                        <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0 space-y-1">
                                <h2
                                    id="project-results-title"
                                    className="text-title font-semibold"
                                >
                                    Peluang project
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Hasil discovery dalam konteks{' '}
                                    {institution.name}.
                                </p>
                            </div>
                            <div
                                role="status"
                                aria-live="polite"
                                className="shrink-0 text-sm text-muted-foreground"
                            >
                                {resultSummary}
                            </div>
                        </div>

                        {hasError && (
                            <ProjectErrorState
                                onRetry={() =>
                                    visitDiscovery(projects.meta.current_page)
                                }
                            />
                        )}

                        {isPending && (
                            <div
                                data-test="projects-refresh-skeleton"
                                className="border-y border-border/80"
                            >
                                <p className="sr-only">
                                    Memuat project terbaru.
                                </p>
                                <ul aria-hidden="true">
                                    <ProjectLedgerSkeleton />
                                </ul>
                            </div>
                        )}

                        {!hasError &&
                            projects.data.length === 0 &&
                            !isPending && (
                                <ProjectEmptyState onReset={resetFilters} />
                            )}

                        {!hasError && projects.data.length > 0 && (
                            <ul
                                data-test="project-ledger"
                                className="min-w-0 bg-card/20"
                            >
                                {projects.data.map((project) => (
                                    <ProjectLedgerRow
                                        key={project.id}
                                        project={project}
                                    />
                                ))}
                            </ul>
                        )}

                        {projects.meta.last_page > 1 && (
                            <nav
                                aria-label="Navigasi halaman project"
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
                                            )
                                        }
                                        aria-label="Halaman sebelumnya"
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
                                            onClick={() => visitDiscovery(page)}
                                            className="min-w-10"
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
                                            )
                                        }
                                        aria-label="Halaman berikutnya"
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
            title: 'Project discovery',
            href: projectsIndex(),
        },
    ],
};
