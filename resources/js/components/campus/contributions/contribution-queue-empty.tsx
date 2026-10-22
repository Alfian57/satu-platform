import { CheckCircle2 } from 'lucide-react';

interface ContributionQueueEmptyProps {
    searchQuery?: string;
    statusFilter?: string;
}

export function ContributionQueueEmpty({
    searchQuery,
    statusFilter,
}: ContributionQueueEmptyProps) {
    return (
        <div
            className="grid justify-items-center gap-3 rounded-3xl border border-border bg-white px-6 py-16 text-center shadow-sm"
            data-test="campus-contribution-queue-empty"
        >
            <div className="flex size-14 items-center justify-center rounded-3xl bg-verified-subtle text-verified-subtle-foreground ring-8 ring-verified-subtle">
                <CheckCircle2 aria-hidden="true" className="size-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">
                {searchQuery
                    ? 'Belum ada hasil yang cocok'
                    : statusFilter === 'approved'
                      ? 'Belum ada hasil disetujui'
                      : 'Antrean kosong'}
            </h3>
            <p className="mx-auto max-w-[50ch] text-xs leading-relaxed text-muted-foreground">
                Tidak ada kontribusi pada filter ini. Coba kata kunci lain atau
                ubah status untuk menelusuri berkas.
            </p>
        </div>
    );
}
