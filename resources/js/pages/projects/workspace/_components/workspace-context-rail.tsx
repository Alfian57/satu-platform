import type { TaskPage, WorkspaceProject } from '@/types';
import { formatDateTime } from './workspace-utils';

export function WorkspaceContextRail({
    project,
    tasks,
}: {
    project: WorkspaceProject;
    tasks: TaskPage;
}) {
    return (
        <div className="grid gap-6">
            <section className="grid gap-3 border-b border-border pb-5">
                <p className="font-label text-label text-muted-foreground">
                    KONTEKS PROYEK
                </p>
                <h2 className="text-lg font-semibold break-words">
                    {project.title}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Ruang kerja adalah catatan kerja bersama. Muat ulang
                    mengambil snapshot terbaru dari database.
                </p>
            </section>

            <dl className="grid gap-4 text-sm">
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        PEMILIK
                    </dt>
                    <dd className="font-semibold break-words">
                        {project.owner.name}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        TENGGAT PROYEK
                    </dt>
                    <dd className="font-semibold">
                        {formatDateTime(project.deadline)}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        TUGAS DALAM DAFTAR
                    </dt>
                    <dd className="font-semibold">{tasks.meta.total} task</dd>
                </div>
            </dl>

            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                Pemilik dan anggota aktif berizin bekerja di sini. Bukti dan
                diskusi privat tidak otomatis dibagikan ke publik.
            </p>
        </div>
    );
}
