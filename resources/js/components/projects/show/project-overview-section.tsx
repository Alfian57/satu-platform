import { CalendarDays, UsersRound } from 'lucide-react';
import {
    displayVisibility,
    formatDeadline,
} from '@/components/projects/show/show-utils';
import { capacityLabel, opportunityStatus } from '@/lib/project-opportunities';
import type { ProjectDetail } from '@/types/project';

export function ProjectOverviewSection({
    project,
}: {
    project: ProjectDetail;
}) {
    return (
        <section className="grid min-w-0 gap-5 px-1 py-2">
            <div className="grid gap-2">
                <p className="text-xs font-semibold text-primary">
                    Tentang proyek
                </p>
                <h2 className="text-title font-semibold">
                    Konteks kerja yang perlu dipahami
                </h2>
            </div>
            {project.description ? (
                <p className="max-w-[78ch] text-body leading-7 wrap-anywhere whitespace-pre-line">
                    {project.description}
                </p>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Deskripsi proyek belum ditambahkan.
                </p>
            )}
            <dl className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
                <div className="grid min-w-0 gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        Batas waktu
                    </dt>
                    <dd className="flex items-start gap-2 text-sm font-semibold wrap-anywhere">
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
                    <dd className="flex items-start gap-2 text-sm font-semibold wrap-anywhere">
                        <UsersRound
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-primary"
                        />
                        <span>
                            {capacityLabel(
                                project.capacity_stats,
                                project.capacity,
                            )}
                            <span className="mt-2 block text-xs leading-5 font-normal text-muted-foreground">
                                {opportunityStatus(
                                    project.capacity_stats,
                                    project.status,
                                    project.deadline,
                                )}
                            </span>
                        </span>
                    </dd>
                </div>
                <div className="grid min-w-0 gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        VISIBILITAS
                    </dt>
                    <dd className="text-sm font-semibold wrap-anywhere">
                        {displayVisibility(project.visibility)}
                    </dd>
                </div>
            </dl>
        </section>
    );
}
