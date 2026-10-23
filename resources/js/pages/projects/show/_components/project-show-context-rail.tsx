import {
    displayVisibility,
    formatDeadline,
} from '@/pages/projects/show/_components/show-utils';
import type { ProjectDetail } from '@/types/project';

export function ProjectShowContextRail({
    project,
}: {
    project: ProjectDetail;
}) {
    return (
        <div className="grid min-w-0 gap-5 border-t border-border px-1 pt-5">
            <section className="grid gap-3 border-b border-border/60 pb-5">
                <p className="text-xs font-semibold text-primary">
                    Universitas
                </p>
                <h2 className="text-title font-semibold wrap-anywhere">
                    {project.institution.name}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Akses mengikuti keanggotaan dan izin proyek. Informasi
                    pemilik, status, batas waktu, dan kebutuhan tim berasal dari
                    proyek yang sama.
                </p>
            </section>

            <dl className="grid gap-4 text-sm">
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">Pemilik</dt>
                    <dd className="font-semibold wrap-anywhere">
                        {project.owner.name}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">
                        Visibilitas
                    </dt>
                    <dd className="font-semibold">
                        {displayVisibility(project.visibility)}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">
                        Pembaruan terakhir
                    </dt>
                    <dd className="font-semibold">
                        {formatDeadline(project.updated_at)}
                    </dd>
                </div>
            </dl>

            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                Informasi dan tindakan yang tersedia mengikuti izin aksesmu pada
                proyek ini.
            </p>
        </div>
    );
}
