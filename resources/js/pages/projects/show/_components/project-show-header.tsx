import { ShieldCheck } from 'lucide-react';
import { DashboardArchiveArt as ArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';
import { ProjectStatusBadge } from '@/pages/projects/show/_components/project-status-badge';
import { statusDescriptions } from '@/pages/projects/show/_components/show-utils';
import type { ProjectDetail, ProjectStatus } from '@/types/project';

export function ProjectShowHeader({
    project,
    isOwner,
}: {
    project: ProjectDetail;
    isOwner: boolean;
}) {
    const status = project.status as ProjectStatus;

    return (
        <header className="relative isolate grid min-w-0 gap-5 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent to-sky-100 p-5 shadow-md sm:p-7">
            <ArchiveArt className="absolute top-5 right-5 -z-10 hidden w-36 -rotate-6 opacity-55 lg:block" />
            <div className="min-w-0 space-y-3 lg:pr-40">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-label text-label text-muted-foreground">
                        PROYEK {String(project.id).padStart(4, '0')}
                    </span>
                    <ProjectStatusBadge status={project.status} />
                </div>
                <h1 className="max-w-[28ch] text-headline font-bold text-balance wrap-anywhere">
                    {project.title}
                </h1>
                <p className="max-w-[70ch] text-body text-muted-foreground">
                    {statusDescriptions[status] ??
                        'Status proyek belum memiliki penjelasan tambahan.'}
                </p>
            </div>

            <div className="grid min-w-0 gap-2 border-t border-white/80 pt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck
                        aria-hidden="true"
                        className="size-4 shrink-0 text-verified"
                    />
                    <span className="text-xs">Pemilik proyek</span>
                </div>
                <p className="font-semibold wrap-anywhere">
                    {project.owner.name}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                    {isOwner
                        ? 'Kamu mengelola detail, kebutuhan tim, dan status proyek ini.'
                        : 'Detail dikelola pemilik. Kamu dapat melihat tindakan yang tersedia sesuai status tim.'}
                </p>
            </div>
        </header>
    );
}
