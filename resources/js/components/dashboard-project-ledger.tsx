import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    ChevronRight,
    FolderOpen,
    RefreshCw,
} from 'lucide-react';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { workspace as projectShow } from '@/routes/projects';
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
        <li className="min-w-0" data-test="dashboard-project-row">
            <Link
                href={projectShow(project.id)}
                className="group flex min-h-44 min-w-0 cursor-pointer items-start gap-3 rounded-2xl p-4 hover:bg-accent/45 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:transition-[background-color,box-shadow] motion-safe:duration-standard sm:items-center sm:gap-4 sm:p-5"
                aria-label={`Buka ruang kerja ${project.name}`}
            >
                <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-primary group-hover:bg-card motion-safe:transition-colors motion-safe:duration-standard sm:size-12"
                >
                    <FolderOpen className="size-5" />
                </span>
                <span className="grid min-w-0 flex-1 gap-1.5">
                    <span className="text-sm font-semibold wrap-anywhere text-foreground sm:text-base">
                        {project.name}
                    </span>
                    <span className="text-sm leading-6 wrap-anywhere text-muted-foreground">
                        <span className="mb-0.5 block text-xs font-medium">
                            Langkah berikutnya
                        </span>
                        {project.nextTask}
                    </span>
                    <span
                        className={cn(
                            'inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium',
                            project.deadlineTone === 'correction'
                                ? 'bg-correction-subtle text-correction-subtle-foreground'
                                : 'bg-background text-muted-foreground',
                        )}
                    >
                        <CalendarDays
                            aria-hidden="true"
                            className="size-3.5 shrink-0"
                        />
                        <span className="min-w-0 wrap-anywhere">
                            Batas{' '}
                            <time dateTime={project.deadlineIso}>
                                {project.deadline}
                            </time>
                            {project.deadlineTone === 'correction' && (
                                <span className="mt-0.5 block font-semibold">
                                    Lewat batas waktu
                                </span>
                            )}
                        </span>
                    </span>
                </span>
                <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground motion-safe:transition-colors motion-safe:duration-standard sm:mt-0">
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
                className="h-auto min-h-11 w-full shrink-0 rounded-xl border-border bg-white py-3 font-semibold whitespace-normal text-primary hover:border-primary hover:bg-accent hover:text-primary sm:w-auto"
            >
                <Link href={href}>
                    <span className="min-w-0 wrap-anywhere">
                        {action.label}
                    </span>
                    <ArrowRight
                        aria-hidden="true"
                        className="size-4 shrink-0"
                    />
                </Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-auto min-h-11 w-full shrink-0 rounded-xl border-border bg-white py-3 font-semibold whitespace-normal text-primary hover:border-primary hover:bg-accent hover:text-primary sm:w-auto"
            onClick={() => onAction(action)}
        >
            <span className="min-w-0 wrap-anywhere">{action.label}</span>
            <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
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
            className="flex flex-col gap-4 rounded-3xl border border-dashed border-border bg-card/70 p-5 sm:p-6"
            data-test={`dashboard-projects-${region.state}`}
            role={region.state === 'error' ? 'alert' : undefined}
        >
            <div className="flex min-w-0 items-start gap-4">
                {region.state === 'empty' ? (
                    <DashboardArchiveArt className="w-20 shrink-0 sm:w-24" />
                ) : (
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
                )}
                <div className="min-w-0">
                    <p className="text-base font-bold text-foreground">
                        {region.title}
                    </p>
                    <p className="mt-1 max-w-[65ch] text-sm leading-6 wrap-anywhere text-muted-foreground">
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
            className="rounded-3xl border border-border bg-card px-2 sm:px-3"
            data-test="dashboard-projects-loading"
            role="status"
        >
            <span className="sr-only">{announcement}</span>
            <div aria-hidden="true" className="grid">
                {[0, 1].map((index) => (
                    <div
                        key={index}
                        className="flex min-h-44 items-start gap-3 border-b border-border/60 p-4 last:border-b-0 sm:items-center sm:p-5"
                    >
                        <Skeleton className="size-11 shrink-0 rounded-2xl sm:size-12" />
                        <div className="grid min-w-0 flex-1 gap-2">
                            <Skeleton className="h-5 w-4/5" />
                            <Skeleton className="h-3 w-1/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-6 w-1/2 rounded-lg" />
                        </div>
                        <Skeleton className="size-8 shrink-0 rounded-xl" />
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
            className="min-w-0"
            data-test="dashboard-ledger"
        >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1 pt-2">
                <div className="min-w-0">
                    <h2
                        id="active-projects-heading"
                        className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
                    >
                        Proyek aktif
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Lanjutkan pekerjaan bersama timmu.
                    </p>
                </div>

                {totalCount !== undefined && (
                    <span
                        aria-label={`${totalCount} proyek`}
                        className="inline-flex items-center rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
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
                <div className="rounded-3xl border border-border bg-card p-2 shadow-sm sm:p-3">
                    <ol className="grid divide-y divide-border/60">
                        {region.projects.map((project) => (
                            <ProjectRow key={project.id} project={project} />
                        ))}
                    </ol>

                    {region.remainingActionLabel && (
                        <div className="border-t border-border/60 px-3 pt-4 pb-2">
                            <RegionAction
                                action={{
                                    key: 'projects',
                                    view: 'mine',
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
