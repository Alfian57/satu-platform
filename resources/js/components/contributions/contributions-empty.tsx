import { Link } from '@inertiajs/react';
import { FolderOpen, Plus } from 'lucide-react';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import { Button } from '@/components/ui/button';
import { create as contributionsCreate } from '@/routes/contributions';
import { index as projectsIndex } from '@/routes/projects';

export interface EmptyContributionsProps {
    canCreate: boolean;
}

export function EmptyContributions({ canCreate }: EmptyContributionsProps) {
    return (
        <section
            data-test="contributions-empty"
            className="grid min-w-0 justify-items-center gap-5 rounded-3xl border border-dashed border-border bg-linear-to-b from-card to-background px-5 py-12 text-center sm:px-8"
        >
            <ArchiveArt className="w-28" />
            <div className="grid gap-2">
                <h2 className="text-title font-semibold">
                    Mulai catatan kontribusi pertamamu.
                </h2>
                <p className="max-w-[58ch] text-sm leading-6 text-muted-foreground">
                    Pekerjaan yang kamu lakukan layak dicatat. Tautkan tugas,
                    ceritakan hasilnya, dan sertakan bukti untuk membantu kampus
                    meninjau kontribusimu.
                </p>
            </div>
            {canCreate ? (
                <Button
                    asChild
                    className="h-auto min-h-11 max-w-full py-3 whitespace-normal"
                >
                    <Link
                        href={contributionsCreate()}
                        data-test="create-contribution-link"
                    >
                        <Plus aria-hidden="true" />
                        Susun kontribusi pertama
                    </Link>
                </Button>
            ) : (
                <div className="grid min-w-0 justify-items-center gap-3">
                    <p className="max-w-[56ch] rounded-2xl border border-pending/30 bg-pending-subtle p-4 text-sm leading-6 text-pending-subtle-foreground">
                        Belum ada proyek yang dapat dipakai untuk menyusun
                        kontribusi. Bergabunglah dengan proyek terlebih dahulu.
                    </p>
                    <Button variant="outline" asChild>
                        <Link href={projectsIndex()}>
                            <FolderOpen aria-hidden="true" />
                            Jelajahi proyek
                        </Link>
                    </Button>
                </div>
            )}
        </section>
    );
}
