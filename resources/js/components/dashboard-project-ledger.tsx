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
            className="grid min-w-0 gap-2 border-l border-slate-200/80 bg-slate-50/60 px-4 py-3 md:hidden"
            data-test="dashboard-project-mobile-facts"
        >
            <span className="grid min-w-0 gap-1 sm:grid-cols-[4.75rem_minmax(0,1fr)] sm:gap-3">
                <span className="font-label text-xs font-bold text-slate-400 uppercase">
                    Proyek
                </span>
                <span className="min-w-0 font-semibold wrap-anywhere text-slate-800">
                    {project.name}
                </span>
            </span>
            <span className="grid min-w-0 gap-1 sm:grid-cols-[4.75rem_minmax(0,1fr)] sm:gap-3">
                <span className="font-label text-xs font-bold text-slate-400 uppercase">
                    Berikutnya
                </span>
                <span className="min-w-0 text-sm wrap-anywhere text-slate-600">
                    {project.nextTask}
                </span>
            </span>
            <span className="grid min-w-0 gap-1 sm:grid-cols-[4.75rem_minmax(0,1fr)] sm:items-center sm:gap-3">
                <span className="font-label text-xs font-bold text-slate-400 uppercase">
                    Batas
                </span>
                <span
                    className={cn(
                        'inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold',
                        project.deadlineTone === 'correction'
                            ? 'text-rose-700'
                            : 'text-slate-700',
                    )}
                >
                    <CalendarDays aria-hidden="true" className="size-3.5" />
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
                className="group grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] items-stretch px-3 py-0 transition-colors hover:bg-blue-50/50 motion-reduce:transition-none md:grid-cols-[3.25rem_minmax(8rem,0.85fr)_minmax(10rem,1.15fr)_7.5rem_2.5rem] md:items-center md:py-3.5"
                aria-label={`Buka project ${project.name}`}
            >
                <span className="my-3 flex size-7 items-center justify-center self-start rounded-lg border border-primary/20 bg-blue-50 font-label text-xs font-bold text-primary md:my-0 md:size-8 md:self-auto">
                    {project.index}
                </span>
                <span className="hidden min-w-0 border-l border-slate-200/80 px-4 py-1 font-bold wrap-anywhere text-slate-900 md:block">
                    {project.name}
                </span>
                <span className="hidden min-w-0 border-l border-slate-200/80 px-4 py-1 text-sm wrap-anywhere text-slate-600 md:block">
                    {project.nextTask}
                </span>
                <span
                    className={cn(
                        'hidden items-center gap-1.5 border-l border-slate-200/80 px-4 py-1 text-xs font-semibold md:flex',
                        project.deadlineTone === 'correction'
                            ? 'text-rose-700'
                            : 'text-slate-700',
                    )}
                >
                    <CalendarDays
                        aria-hidden="true"
                        className="size-3.5 text-slate-400"
                    />
                    <time dateTime={project.deadlineIso}>
                        {project.deadline}
                    </time>
                </span>
                <span className="hidden items-center justify-center md:flex">
                    <ChevronRight
                        aria-hidden="true"
                        className="size-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-primary"
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
                className="w-full shrink-0 rounded-xl border-slate-300 font-bold text-primary hover:border-primary hover:bg-blue-50 hover:text-primary sm:w-auto"
            >
                <Link href={href}>
                    {action.label}
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full shrink-0 rounded-xl border-slate-300 font-bold text-primary hover:border-primary hover:bg-blue-50 hover:text-primary sm:w-auto"
            onClick={() => onAction(action)}
        >
            {action.label}
            <ArrowRight aria-hidden="true" className="size-4" />
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
            className="flex flex-col gap-4 rounded-2xl border border-slate-300/80 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6"
            data-test={`dashboard-projects-${region.state}`}
            role={region.state === 'error' ? 'alert' : undefined}
        >
            <div className="flex min-w-0 items-start gap-4">
                <span className="shrink-0 rounded-xl border border-primary/20 bg-blue-50 p-3 text-primary">
                    <Icon
                        aria-hidden="true"
                        className={cn(
                            'size-6',
                            region.state === 'error'
                                ? 'text-rose-600'
                                : 'text-primary',
                        )}
                    />
                </span>
                <div className="min-w-0">
                    <p className="text-base font-bold text-slate-900">
                        {region.title}
                    </p>
                    <p className="mt-1 max-w-[65ch] text-xs leading-5 text-slate-500">
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
            className="overflow-hidden rounded-2xl border border-slate-300/80 bg-white"
            data-test="dashboard-projects-loading"
            role="status"
        >
            <span className="sr-only">{announcement}</span>
            <div aria-hidden="true" className="grid">
                {[0, 1].map((index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[2.75rem_minmax(0,1fr)] border-b border-slate-100 px-3 py-4 last:border-b-0 md:grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,1fr)_6.5rem]"
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
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
                <h2
                    id="active-projects-heading"
                    className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl"
                >
                    Proyek aktif
                </h2>

                {totalCount !== undefined && (
                    <span
                        aria-label={`${totalCount} proyek`}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-label text-xs font-bold text-slate-700"
                        data-test="dashboard-project-count"
                    >
                        {totalCount} proyek
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
                <div className="overflow-hidden rounded-2xl border border-slate-300/80 bg-white shadow-xs">
                    <div
                        aria-hidden="true"
                        className="hidden grid-cols-[3.25rem_minmax(8rem,0.85fr)_minmax(10rem,1.15fr)_7.5rem_2.5rem] border-b border-slate-200/80 bg-slate-50/80 font-label text-[11px] font-bold tracking-wider text-slate-500 uppercase md:grid"
                    >
                        <span />
                        <span className="border-l border-slate-200/80 px-4 py-2.5">
                            Proyek
                        </span>
                        <span className="border-l border-slate-200/80 px-4 py-2.5">
                            Berikutnya
                        </span>
                        <span className="border-l border-slate-200/80 px-4 py-2.5">
                            Batas waktu
                        </span>
                        <span />
                    </div>

                    <ol className="divide-y divide-slate-100">
                        {region.projects.map((project) => (
                            <ProjectRow key={project.id} project={project} />
                        ))}
                    </ol>

                    {region.remainingActionLabel && (
                        <div className="border-t border-slate-200/80 bg-slate-50/80 px-4 py-3">
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
