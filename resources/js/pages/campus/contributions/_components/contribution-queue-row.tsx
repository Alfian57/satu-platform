import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContributionStatusChip } from '@/pages/campus/contributions/_components/contribution-status-chip';
import {
    formatDate,
    statusMeta,
} from '@/pages/campus/contributions/_types/contribution-types';
import type { ContributionReviewQueueItem } from '@/pages/campus/contributions/_types/contribution-types';

interface ContributionQueueRowProps {
    item: ContributionReviewQueueItem;
    isSelected: boolean;
    isProcessing: boolean;
    onSelect: (item: ContributionReviewQueueItem) => void;
}

export function ContributionQueueRow({
    item,
    isSelected,
    isProcessing,
    onSelect,
}: ContributionQueueRowProps) {
    const itemStatus = statusMeta[item.status];

    return (
        <article
            className={cn(
                'group relative overflow-hidden rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5',
                isSelected &&
                    'border-primary bg-accent/70 shadow-md ring-2 ring-primary/20',
            )}
            data-test={`campus-contribution-row-${item.id}`}
        >
            <button
                type="button"
                disabled={isProcessing}
                className="grid w-full cursor-pointer gap-4 rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 @min-[46rem]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_9rem] @min-[46rem]:items-center"
                aria-pressed={isSelected}
                onClick={() => onSelect(item)}
                data-test={`campus-contribution-select-${item.id}`}
            >
                <div className="flex items-start gap-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/70 text-primary">
                        <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                            {item.reference}
                        </span>
                        <h3 className="mt-0.5 text-lg font-bold wrap-anywhere text-foreground">
                            {(item.status === 'approved'
                                ? item.current_version?.claim
                                : null) || item.project.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Oleh:{' '}
                            <strong className="font-semibold text-foreground">
                                {item.contributor.name}
                            </strong>
                        </p>
                        {item.status === 'approved' && (
                            <div
                                className="mt-2 space-y-1"
                                data-test={`campus-contribution-result-${item.id}`}
                            >
                                <p className="text-xs text-muted-foreground">
                                    {item.project.title}
                                </p>
                                <p className="line-clamp-3 text-sm leading-6 wrap-anywhere text-foreground">
                                    {item.current_version?.summary ||
                                        'Ringkasan versi belum tersedia.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="min-w-0 text-xs">
                    <p className="font-semibold break-words text-foreground">
                        {item.current_version?.task?.title ??
                            'Tugas belum tersedia'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {item.current_version
                            ? `Versi ${item.current_version.version_number}`
                            : 'Versi belum tersedia'}{' '}
                        •{' '}
                        {item.submitted_at
                            ? `Dikirim ${formatDate(item.submitted_at)}`
                            : 'Waktu kirim belum tercatat'}
                    </p>
                    <p className="mt-1.5 text-muted-foreground">
                        {itemStatus.description}
                    </p>
                </div>

                <div className="flex items-center justify-between gap-3 @min-[46rem]:flex-col @min-[46rem]:items-end">
                    <ContributionStatusChip status={item.status} />
                    <span
                        className={`text-xs font-semibold ${
                            isSelected
                                ? 'text-primary'
                                : 'text-muted-foreground group-hover:text-primary'
                        }`}
                    >
                        {isSelected ? 'Berkas dipilih' : 'Buka berkas'}
                    </span>
                </div>
            </button>
        </article>
    );
}
