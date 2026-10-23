import { UsersRound } from 'lucide-react';
import type { TeamFormationState } from '@/types/project';

type Props = {
    capacity: TeamFormationState['capacity'];
};

export function TeamCapacityCard({ capacity }: Props) {
    return (
        <section
            aria-labelledby="team-capacity-title"
            className="grid gap-3 rounded-3xl border border-border bg-linear-to-br from-accent/70 to-background p-5 sm:p-6"
            data-test="team-capacity"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <h3
                    id="team-capacity-title"
                    className="text-title font-semibold"
                >
                    {capacity.is_full
                        ? 'Kapasitas penuh untuk saat ini'
                        : capacity.state === 'closed'
                          ? 'Proyek tidak sedang menerima anggota'
                          : 'Tempat tim yang masih tersedia'}
                </h3>
                <span className="font-label text-label text-muted-foreground">
                    {capacity.occupied}/{capacity.total} TERISI
                </span>
            </div>
            <div
                aria-hidden="true"
                className="h-2.5 overflow-hidden rounded-full bg-muted"
            >
                <div
                    className="h-full rounded-full bg-primary"
                    style={{
                        width: `${Math.min(100, (capacity.occupied / Math.max(1, capacity.total)) * 100)}%`,
                    }}
                />
            </div>
            <p className="flex gap-2 text-sm leading-6 text-muted-foreground">
                <UsersRound
                    className="mt-1 size-4 shrink-0"
                    aria-hidden="true"
                />
                <span>
                    {capacity.remaining} tempat tersisa secara fisik.{' '}
                    {capacity.state === 'open'
                        ? 'Pemilik mempertimbangkan kebutuhan dan kapasitas peran sebelum menerima.'
                        : 'Pengajuan baru ditutup. Pengajuan menunggu masih dapat ditarik atau ditolak.'}
                </span>
            </p>
        </section>
    );
}
