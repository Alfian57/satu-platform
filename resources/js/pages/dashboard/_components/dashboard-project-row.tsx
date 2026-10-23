import { Link } from '@inertiajs/react';
import { CalendarDays, ChevronRight, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { workspace as projectShow } from '@/routes/projects';
import type { DashboardActiveProject } from '@/types';

export function DashboardProjectRow({
    project,
}: {
    project: DashboardActiveProject;
}) {
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
