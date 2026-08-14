import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    ChevronRight,
    FolderOpen,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { show as projectShow } from '@/routes/projects';
import type {
    DashboardAction,
    DashboardActiveProject,
    DashboardProjectsRegion,
} from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

type Props = {
    region: DashboardProjectsRegion;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
};

function MobileProjectFacts({ project }: { project: DashboardActiveProject }) {
    return (
        <span
            className="grid min-w-0 gap-2 border-l border-slate-100 bg-slate-50/55 px-4 py-3 md:hidden"
            data-test="dashboard-project-mobile-facts"
        >
            <span className="grid min-w-0 gap-1 sm:grid-cols-[4.75rem_minmax(0,1fr)] sm:gap-3">
                <span className="font-label text-label font-semibold text-muted-foreground">
                    Project
                </span>
                <span className="min-w-0 font-semibold wrap-anywhere">
                    {project.name}
                </span>
            </span>
            <span className="grid min-w-0 gap-1 sm:grid-cols-[4.75rem_minmax(0,1fr)] sm:gap-3">
                <span className="font-label text-label font-semibold text-muted-foreground">
                    Berikutnya
                </span>
                <span className="min-w-0 text-sm leading-5 wrap-anywhere">
                    {project.nextTask}
                </span>
            </span>
            <span className="grid min-w-0 gap-1 sm:grid-cols-[4.75rem_minmax(0,1fr)] sm:items-center sm:gap-3">
                <span className="font-label text-label font-semibold text-muted-foreground">
                    Batas
                </span>
                <span
                    className={cn(
                        'inline-flex min-w-0 items-center gap-2 text-sm font-semibold',
                        project.deadlineTone === 'correction'
                            ? 'text-correction'
                            : 'text-foreground',
                    )}
                >
                    <CalendarDays aria-hidden="true" className="size-4" />
                    <time dateTime={project.deadlineIso}>
                        {project.deadline}
                    </time>
                </span>
            </span>
        </span>
    );
}

function ProjectRow({ project }: { project: DashboardActiveProject }) {
    return (
        <li data-test="dashboard-project-row">
            <Link
                href={projectShow(project.id)}
                className="group grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] items-stretch px-3 py-0 transition-colors hover:bg-blue-50/70 motion-reduce:transition-none md:grid-cols-[3.25rem_minmax(8rem,0.85fr)_minmax(10rem,1.15fr)_6.5rem_2.5rem] md:items-center md:py-3.5"
                aria-label={`Buka project ${project.name}`}
            >
                <span className="my-3 flex size-7 items-center justify-center self-start rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 font-label text-label font-bold text-white shadow-sm md:my-0 md:size-8 md:self-auto">
                    {project.index}
                </span>
                <span className="hidden min-w-0 border-l border-border px-4 py-1 font-semibold wrap-anywhere md:block">
                    {project.name}
                </span>
                <span className="hidden min-w-0 border-l border-border px-4 py-1 text-sm leading-5 wrap-anywhere md:block">
                    {project.nextTask}
                </span>
                <span
                    className={cn(
                        'hidden items-center gap-2 border-l border-border px-4 py-1 text-sm font-semibold md:flex',
                        project.deadlineTone === 'correction'
                            ? 'text-correction'
                            : 'text-foreground',
                    )}
                >
                    <CalendarDays aria-hidden="true" className="size-4" />
                    <time dateTime={project.deadlineIso}>
                        {project.deadline}
                    </time>
                </span>
                <span className="hidden items-center justify-center md:flex">
                    <ChevronRight
                        aria-hidden="true"
                        className="size-4 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                </span>
                <MobileProjectFacts project={project} />
            </Link>
        </li>
    );
}

function RegionAction({
    action,
    getActionHref,
    onAction,
}: {
    action: DashboardAction;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
}) {
    const href = getActionHref(action);

    if (href !== null) {
        return (
            <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full shrink-0 rounded-xl border-blue-200 text-blue-700 transition-colors hover:border-blue-600 hover:bg-blue-600 hover:text-white sm:w-auto"
            >
                <Link href={href}>
                    {action.label}
                    <ArrowRight aria-hidden="true" />
                </Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full shrink-0 rounded-xl border-blue-200 text-blue-700 transition-colors hover:border-blue-600 hover:bg-blue-600 hover:text-white sm:w-auto"
            onClick={() => onAction(action)}
        >
            {action.label}
            <ArrowRight aria-hidden="true" />
        </Button>
    );
}

function ProjectRegionState({
    region,
    getActionHref,
    onAction,
}: {
    region: Extract<
        DashboardProjectsRegion,
        { state: 'empty' | 'error' | 'forbidden' }
    >;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
}) {
    const Icon = region.state === 'error' ? RefreshCw : FolderOpen;

    return (
        <div
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-[0_16px_38px_-34px_rgba(30,64,175,0.45)] sm:flex-row sm:items-center sm:justify-between"
            data-test={`dashboard-projects-${region.state}`}
            role={region.state === 'error' ? 'alert' : undefined}
        >
            <div className="flex min-w-0 items-start gap-3.5">
                <span className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-blue-700">
                    <Icon
                        aria-hidden="true"
                        className={cn(
                            'size-5',
                            region.state === 'error'
                                ? 'text-correction'
                                : 'text-primary',
                        )}
                    />
                </span>
                <div className="min-w-0">
                    <p className="font-semibold">{region.title}</p>
                    <p className="mt-1 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                        {region.description}
                    </p>
                </div>
            </div>
            {region.action && (
                <RegionAction
                    action={region.action}
                    getActionHref={getActionHref}
                    onAction={onAction}
                />
            )}
        </div>
    );
}

function ProjectLoading({ announcement }: { announcement: string }) {
    return (
        <div
            aria-busy="true"
            aria-live="polite"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            data-test="dashboard-projects-loading"
            role="status"
        >
            <span className="sr-only">{announcement}</span>
            <div aria-hidden="true" className="grid">
                {[0, 1].map((index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[2.75rem_minmax(0,1fr)] border-b border-border/80 px-3 py-4 last:border-b-0 md:grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,1fr)_6.5rem]"
                    >
                        <Skeleton className="h-4 w-5" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="hidden h-4 w-4/5 md:block" />
                        <Skeleton className="hidden h-4 w-16 md:block" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DashboardProjectLedger({
    region,
    getActionHref,
    onAction,
}: Props) {
    const totalCount =
        region.state === 'ready'
            ? region.totalCount
            : region.state === 'empty'
              ? 0
              : undefined;

    return (
        <section
            aria-labelledby="active-projects-heading"
            data-test="dashboard-ledger"
        >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 xl:mb-2">
                <div>
                    <p className="text-xs font-bold tracking-[0.13em] text-blue-700 uppercase xl:hidden">
                        Yang sedang berjalan
                    </p>
                    <h2
                        id="active-projects-heading"
                        className="mt-1 text-title font-bold tracking-[-0.025em] text-slate-950 xl:mt-0"
                    >
                        Project aktif
                    </h2>
                </div>
                {totalCount !== undefined && (
                    <span
                        aria-label={`${totalCount} project`}
                        className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700"
                        data-test="dashboard-project-count"
                    >
                        {totalCount} project
                    </span>
                )}
            </div>

            {region.state === 'loading' && (
                <ProjectLoading announcement={region.announcement} />
            )}

            {(region.state === 'empty' ||
                region.state === 'error' ||
                region.state === 'forbidden') && (
                <ProjectRegionState
                    region={region}
                    getActionHref={getActionHref}
                    onAction={onAction}
                />
            )}

            {region.state === 'ready' && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_38px_-34px_rgba(30,64,175,0.45)]">
                    <div
                        aria-hidden="true"
                        className="hidden grid-cols-[3.25rem_minmax(8rem,0.85fr)_minmax(10rem,1.15fr)_6.5rem_2.5rem] border-b border-slate-100 bg-slate-50 font-label text-[11px] font-semibold tracking-wider text-slate-500 uppercase md:grid"
                    >
                        <span />
                        <span className="border-l border-border/80 px-4 py-2.5">
                            Project
                        </span>
                        <span className="border-l border-border/80 px-4 py-2.5">
                            Berikutnya
                        </span>
                        <span className="border-l border-border/80 px-4 py-2.5">
                            Batas waktu
                        </span>
                        <span />
                    </div>

                    <ol className="divide-y divide-border/80">
                        {region.projects.map((project) => (
                            <ProjectRow key={project.id} project={project} />
                        ))}
                    </ol>

                    {region.remainingActionLabel && (
                        <div className="border-t border-slate-100 bg-slate-50 px-3 py-3">
                            <RegionAction
                                action={{
                                    key: 'projects',
                                    label: region.remainingActionLabel,
                                }}
                                getActionHref={getActionHref}
                                onAction={onAction}
                            />
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
