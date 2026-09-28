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

function ProjectRow({ project }: { project: DashboardActiveProject }) {
    return (
        <li data-test="dashboard-project-row">
            <Link
                href={projectShow(project.id)}
                className="group flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border border-white bg-card p-4 shadow-xs transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none sm:items-center sm:gap-4 sm:p-5"
                aria-label={`Buka proyek ${project.name}`}
            >
                <span
                    aria-hidden="true"
                    className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-sky-100 to-blue-200 text-primary sm:size-16"
                >
                    <FolderOpen className="size-6 -rotate-6 transition-transform group-hover:rotate-0 motion-reduce:transform-none sm:size-8" />
                </span>
                <span className="grid min-w-0 flex-1 gap-1.5">
                    <span className="text-sm font-bold wrap-anywhere text-foreground sm:text-base">
                        {project.name}
                    </span>
                    <span className="text-xs leading-5 wrap-anywhere text-muted-foreground">
                        {project.nextTask}
                    </span>
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-medium',
                            project.deadlineTone === 'correction'
                                ? 'text-correction'
                                : 'text-muted-foreground',
                        )}
                    >
                        <CalendarDays
                            aria-hidden="true"
                            className="size-3.5 shrink-0"
                        />
                        Batas{' '}
                        <time dateTime={project.deadlineIso}>
                            {project.deadline}
                        </time>
                    </span>
                </span>
                <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:mt-0 sm:size-10">
                    <ChevronRight aria-hidden="true" className="size-4" />
                </span>
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
                className="min-h-11 w-full shrink-0 rounded-full border-border bg-white font-semibold text-primary hover:border-primary hover:bg-accent hover:text-primary sm:w-auto"
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
            className="min-h-11 w-full shrink-0 rounded-full border-border bg-white font-semibold text-primary hover:border-primary hover:bg-accent hover:text-primary sm:w-auto"
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
            className="flex flex-col gap-4 rounded-3xl border border-white bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
            data-test={`dashboard-projects-${region.state}`}
            role={region.state === 'error' ? 'alert' : undefined}
        >
            <div className="flex min-w-0 items-start gap-4">
                <span className="shrink-0 rounded-2xl bg-accent p-3 text-primary">
                    <Icon
                        aria-hidden="true"
                        className={cn(
                            'size-6',
                            region.state === 'error'
                                ? 'text-correction'
                                : 'text-primary',
                        )}
                    />
                </span>
                <div className="min-w-0">
                    <p className="text-base font-bold text-foreground">
                        {region.title}
                    </p>
                    <p className="mt-1 max-w-[65ch] text-xs leading-5 text-muted-foreground">
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
            className="overflow-hidden rounded-3xl border border-white bg-card shadow-sm"
            data-test="dashboard-projects-loading"
            role="status"
        >
            <span className="sr-only">{announcement}</span>
            <div aria-hidden="true" className="grid">
                {[0, 1].map((index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[2.75rem_minmax(0,1fr)] border-b border-border/50 px-3 py-4 last:border-b-0 md:grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,1fr)_6.5rem]"
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
                    className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
                >
                    Proyek aktif
                </h2>

                {totalCount !== undefined && (
                    <span
                        aria-label={`${totalCount} proyek`}
                        className="inline-flex items-center rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"
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
                <div className="grid gap-3">
                    <ol className="grid gap-3">
                        {region.projects.map((project) => (
                            <ProjectRow key={project.id} project={project} />
                        ))}
                    </ol>

                    {region.remainingActionLabel && (
                        <div className="pt-1">
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
