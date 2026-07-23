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
import type { DashboardActiveProject, DashboardProjectsRegion } from '@/types';

type Props = {
    region: DashboardProjectsRegion;
    onDemoAction: (actionLabel: string) => void;
};

function MobileProjectFacts({ project }: { project: DashboardActiveProject }) {
    return (
        <span
            className="grid min-w-0 gap-2 border-l border-border px-4 py-3 md:hidden"
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
                    <CalendarDays
                        aria-hidden="true"
                        className="size-4 shrink-0"
                    />
                    <time dateTime={project.deadlineIso}>
                        {project.deadline}
                    </time>
                </span>
            </span>
        </span>
    );
}

function ProjectRow({
    project,
    onDemoAction,
}: {
    project: DashboardActiveProject;
    onDemoAction: (actionLabel: string) => void;
}) {
    return (
        <li
            data-test="dashboard-project-row"
            className="border-b border-border last:border-b-0"
        >
            <button
                type="button"
                className="grid min-h-11 w-full grid-cols-[2.75rem_minmax(0,1fr)] items-stretch text-left transition-colors duration-fast ease-ledger hover:bg-accent/60 motion-reduce:transition-none md:grid-cols-[3.25rem_minmax(8rem,0.85fr)_minmax(10rem,1.15fr)_6.5rem_2.5rem]"
                onClick={() => onDemoAction(`Buka project ${project.name}`)}
            >
                <span className="self-center px-3 py-4 text-right font-label text-label text-muted-foreground md:px-4">
                    {project.index}
                </span>

                <MobileProjectFacts project={project} />

                <span className="hidden min-w-0 border-l border-border px-4 py-3 font-semibold wrap-anywhere md:block">
                    {project.name}
                </span>
                <span className="hidden min-w-0 border-l border-border px-4 py-3 text-sm leading-5 wrap-anywhere md:block">
                    {project.nextTask}
                </span>
                <span
                    className={cn(
                        'hidden min-w-0 items-center gap-2 border-l border-border px-4 py-3 text-sm font-semibold md:inline-flex',
                        project.deadlineTone === 'correction'
                            ? 'text-correction'
                            : 'text-foreground',
                    )}
                >
                    <CalendarDays
                        aria-hidden="true"
                        className="size-4 shrink-0"
                    />
                    <time dateTime={project.deadlineIso}>
                        {project.deadline}
                    </time>
                </span>
                <span className="hidden items-center justify-center md:flex">
                    <ChevronRight aria-hidden="true" className="size-4" />
                </span>
            </button>
        </li>
    );
}

function ProjectRegionState({
    region,
    onDemoAction,
}: {
    region: Extract<DashboardProjectsRegion, { state: 'empty' | 'error' }>;
    onDemoAction: (actionLabel: string) => void;
}) {
    const Icon = region.state === 'error' ? RefreshCw : FolderOpen;
    const actionLabel = region.actionLabel;

    return (
        <div
            className="flex flex-col gap-4 border-y border-border bg-card px-4 py-5 sm:flex-row sm:items-center sm:justify-between"
            data-test={`dashboard-projects-${region.state}`}
            role={region.state === 'error' ? 'alert' : undefined}
        >
            <div className="flex min-w-0 items-start gap-3">
                <Icon
                    aria-hidden="true"
                    className={cn(
                        'mt-0.5 size-5 shrink-0',
                        region.state === 'error'
                            ? 'text-correction'
                            : 'text-primary',
                    )}
                />
                <div className="min-w-0">
                    <p className="font-semibold">{region.title}</p>
                    <p className="mt-1 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                        {region.description}
                    </p>
                </div>
            </div>
            {actionLabel && (
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full shrink-0 border-primary text-primary hover:text-primary sm:w-auto"
                    onClick={() => onDemoAction(actionLabel)}
                >
                    {actionLabel}
                    <ArrowRight aria-hidden="true" />
                </Button>
            )}
        </div>
    );
}

function ProjectLoading({ announcement }: { announcement: string }) {
    return (
        <div
            aria-busy="true"
            aria-live="polite"
            className="border-y border-border"
            data-test="dashboard-projects-loading"
            role="status"
        >
            <span className="sr-only">{announcement}</span>
            <div aria-hidden="true" className="grid">
                {[0, 1].map((index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[2.75rem_minmax(0,1fr)] border-b border-border px-3 py-4 last:border-b-0 md:grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,1fr)_6.5rem]"
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

export function DashboardProjectLedger({ region, onDemoAction }: Props) {
    const totalCount =
        region.state === 'ready'
            ? region.totalCount
            : region.state === 'empty'
              ? 0
              : undefined;
    const remainingActionLabel =
        region.state === 'ready' ? region.remainingActionLabel : undefined;

    return (
        <section
            aria-labelledby="active-projects-heading"
            data-test="dashboard-ledger"
        >
            <div className="mb-3 flex items-baseline gap-2">
                <h2
                    id="active-projects-heading"
                    className="text-title font-bold"
                >
                    Project aktif
                </h2>
                {totalCount !== undefined && (
                    <span
                        aria-label={`${totalCount} project`}
                        className="font-label text-label text-muted-foreground"
                        data-test="dashboard-project-count"
                    >
                        {totalCount}
                    </span>
                )}
            </div>

            {region.state === 'loading' && (
                <ProjectLoading announcement={region.announcement} />
            )}

            {(region.state === 'empty' || region.state === 'error') && (
                <ProjectRegionState
                    region={region}
                    onDemoAction={onDemoAction}
                />
            )}

            {region.state === 'ready' && (
                <>
                    <div
                        aria-hidden="true"
                        className="hidden grid-cols-[3.25rem_minmax(8rem,0.85fr)_minmax(10rem,1.15fr)_6.5rem_2.5rem] border-y border-border bg-muted/35 font-label text-label font-semibold text-muted-foreground md:grid"
                    >
                        <span />
                        <span className="border-l border-border px-4 py-2">
                            Project
                        </span>
                        <span className="border-l border-border px-4 py-2">
                            Tugas berikutnya
                        </span>
                        <span className="border-l border-border px-4 py-2">
                            Batas waktu
                        </span>
                        <span />
                    </div>

                    <ol className="border-y border-border md:border-t-0">
                        {region.projects.map((project) => (
                            <ProjectRow
                                key={project.index}
                                project={project}
                                onDemoAction={onDemoAction}
                            />
                        ))}
                    </ol>

                    {remainingActionLabel && (
                        <div className="border-b border-border py-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="lg"
                                className="w-full justify-between text-primary hover:text-primary"
                                onClick={() =>
                                    onDemoAction(remainingActionLabel)
                                }
                            >
                                {remainingActionLabel}
                                <ArrowRight aria-hidden="true" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
