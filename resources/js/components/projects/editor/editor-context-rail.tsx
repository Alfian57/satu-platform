import type { ProjectDetail, ProjectInstitution } from '@/types/project';
import type { EditorMode } from './editor-utils';

type Props = {
    institution: ProjectInstitution;
    mode: EditorMode;
    project?: ProjectDetail;
    roleCapacity: number;
    totalCapacity: number;
};

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    open: 'Terbuka',
    forming: 'Pembentukan tim',
    full: 'Penuh',
    closed: 'Ditutup',
    cancelled: 'Dibatalkan',
    archived: 'Diarsipkan',
};

export function EditorContextRail({
    institution,
    mode,
    project,
    roleCapacity,
    totalCapacity,
}: Props) {
    return (
        <div className="grid min-w-0 gap-5 rounded-3xl border border-border bg-linear-to-br from-accent/70 to-background p-5 sm:p-6">
            <section className="grid gap-3 border-b border-border/60 pb-5">
                <p className="text-xs font-semibold text-primary">
                    Konteks proyek
                </p>
                <h2 className="text-title font-semibold wrap-anywhere">
                    {institution.name}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    {mode === 'create'
                        ? 'Proyek baru akan dibuat sebagai draft dan tetap berada dalam ruang kampus ini.'
                        : 'Perubahan ini hanya dapat dilakukan oleh pemilik proyek pada afiliasi kampus yang terverifikasi.'}
                </p>
            </section>

            <dl className="grid gap-4 text-sm">
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        Status proyek
                    </dt>
                    <dd className="font-semibold">
                        {statusLabels[project?.status ?? 'draft'] ??
                            project?.status}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        Kapasitas peran
                    </dt>
                    <dd className="font-semibold">
                        {roleCapacity} dari {totalCapacity} slot
                    </dd>
                </div>
            </dl>

            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                Setelah disimpan, proyek dapat dibuka ketika kebutuhan tim dan
                batas waktu sudah siap. Perubahan status tetap tercatat di
                riwayat audit.
            </p>
        </div>
    );
}
