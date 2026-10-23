import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InclusionSignalItem } from '@/pages/campus/inclusion/_types/inclusion-types';

interface InclusionQueueItemProps {
    signal: InclusionSignalItem;
    isSelected: boolean;
    busy: boolean;
    onSelect: (signalId: number) => void;
}

export function InclusionQueueItem({
    signal,
    isSelected,
    busy,
    onSelect,
}: InclusionQueueItemProps) {
    return (
        <button
            type="button"
            disabled={busy}
            onClick={() => onSelect(signal.id)}
            aria-pressed={isSelected}
            data-test="inclusion-queue-item"
            className={cn(
                'block w-full min-w-0 cursor-pointer rounded-3xl border bg-white p-4 text-left shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:p-5',
                isSelected
                    ? 'border-primary bg-accent/35 ring-1 ring-primary/15'
                    : 'border-border',
            )}
        >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-primary">
                        Berkas IN-{signal.id}
                    </p>
                    <h3 className="mt-1 text-lg font-bold wrap-anywhere">
                        {signal.subject_name ||
                            `Mahasiswa #${signal.subject_id}`}
                    </h3>
                </div>
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                        signal.restricted_feature_state
                            ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                            : 'border-border bg-accent text-muted-foreground',
                    )}
                >
                    <Info aria-hidden="true" className="size-3.5" />
                    {signal.restricted_feature_state
                        ? 'Perlu tinjauan'
                        : 'Tidak ditandai'}
                </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Periode {signal.period}.{' '}
                {signal.data_sufficiency_met
                    ? 'Kecukupan data terpenuhi.'
                    : 'Data belum cukup. Perlu konteks tambahan.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">
                    {signal.reviews.length} tinjauan tercatat
                </span>
                <span className="font-semibold text-primary">
                    {isSelected ? 'Berkas dipilih' : 'Buka berkas'}
                </span>
            </div>
        </button>
    );
}
