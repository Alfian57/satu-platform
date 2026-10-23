import { CheckCircle2, Clock3, FileWarning, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewQueue } from '@/pages/campus/contributions/_types/contribution-types';

interface ContributionSummaryRailProps {
    reviewQueue: ReviewQueue;
}

export function ContributionSummaryRail({
    reviewQueue,
}: ContributionSummaryRailProps) {
    const stats = [
        {
            label: 'Menunggu validasi',
            value: reviewQueue.summary.pending,
            icon: Clock3,
            tone: 'text-pending-subtle-foreground',
        },
        {
            label: 'Tervalidasi',
            value: reviewQueue.summary.approved,
            icon: CheckCircle2,
            tone: 'text-verified-subtle-foreground',
        },
        {
            label: 'Perlu diperbaiki',
            value: reviewQueue.summary.revision,
            icon: FileWarning,
            tone: 'text-correction-subtle-foreground',
        },
        {
            label: 'Ditolak',
            value: reviewQueue.summary.rejected,
            icon: XCircle,
            tone: 'text-muted-foreground',
        },
    ];

    return (
        <section
            aria-label="Ringkasan validasi kampus"
            className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-border px-1 py-5 lg:grid-cols-4"
        >
            {stats.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className="flex min-w-0 items-start gap-3">
                    <span
                        className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/70',
                            tone,
                        )}
                    >
                        <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs leading-5 text-muted-foreground">
                            {label}
                        </p>
                        <p className="mt-1 text-2xl font-bold tabular-nums">
                            {value}
                        </p>
                    </div>
                </div>
            ))}
        </section>
    );
}
