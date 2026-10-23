import { Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarDays,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    beginnerLabel,
    capacityLabel,
    opportunityStatus,
} from '@/lib/project-opportunities';
import {
    displayProficiency,
    displayVisibility,
    formatDeadline,
} from '@/pages/projects/index/_components/catalog-utils';
import type { ProjectSummary } from '@/pages/projects/index/_components/catalog-utils';
import { ProjectStatusBadge } from '@/pages/projects/index/_components/project-status-badge';
import { show as projectShow } from '@/routes/projects';

export function ProjectLedgerRow({ project }: { project: ProjectSummary }) {
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
            className="project-discovery-card min-w-0 rounded-xl border border-border bg-card shadow-sm focus-within:border-primary/40"
        >
            <article className="flex h-full min-w-0 flex-col gap-4 p-4 sm:p-5">
                <div className="min-w-0 space-y-4">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <ProjectStatusBadge status={project.status} />
                        <span className="ml-auto inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground">
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
                        <div className="project-discovery-roles min-w-0 space-y-3 rounded-xl p-3.5">
                            <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                                <UsersRound
                                    aria-hidden="true"
                                    className="size-4 shrink-0"
                                />
                                Peran yang dibutuhkan
                            </p>
                            {project.roles.length > 0 ? (
                                <ul className="grid gap-2.5 text-sm">
                                    {project.roles.slice(0, 3).map((role) => (
                                        <li
                                            key={role.id}
                                            className="grid min-w-0 gap-1 border-t border-primary/10 pt-2.5 first:border-0 first:pt-0"
                                        >
                                            <span className="min-w-0 font-semibold wrap-anywhere text-foreground">
                                                {role.title}
                                            </span>
                                            <span className="text-xs leading-5 text-muted-foreground">
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
                                            className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-md border border-border/80 px-2 py-1 text-xs text-foreground"
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
                </dl>
                <p className="text-xs leading-5 text-muted-foreground">
                    {opportunityStatus(
                        project.capacity_stats,
                        project.status,
                        project.deadline,
                    )}
                </p>
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                            Pemilik proyek
                        </p>
                        <p className="mt-1 text-sm font-medium wrap-anywhere">
                            {project.owner.name}
                        </p>
                    </div>
                    <Button
                        asChild
                        variant="outline"
                        className="min-h-11 shrink-0 rounded-xl border-primary/25 bg-white text-primary hover:bg-accent hover:text-primary"
                    >
                        <Link
                            href={projectShow(project.id)}
                            aria-label={`Lihat proyek ${project.title}`}
                        >
                            Lihat proyek{' '}
                            <ArrowUpRight
                                aria-hidden="true"
                                className="size-4"
                            />
                        </Link>
                    </Button>
                </div>
            </article>
        </li>
    );
}
