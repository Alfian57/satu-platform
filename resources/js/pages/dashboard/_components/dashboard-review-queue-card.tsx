import { ClipboardCheck, Clock3 } from 'lucide-react';
import type { DashboardReviewQueue } from '@/types';

interface DashboardReviewQueueCardProps {
    reviewQueue: DashboardReviewQueue;
}

export function DashboardReviewQueueCard({
    reviewQueue,
}: DashboardReviewQueueCardProps) {
    return (
        <section
            aria-labelledby="review-queue-heading"
            className="min-w-0 border-t border-border px-1 pt-5"
        >
            <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center text-primary">
                    <ClipboardCheck aria-hidden="true" className="size-4" />
                </span>
                <h2
                    id="review-queue-heading"
                    className="text-sm font-semibold text-foreground"
                >
                    Validasi kontribusi
                </h2>
            </div>
            <div className="mt-3 flex items-start gap-3">
                <Clock3
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0">
                    <p className="text-sm leading-snug font-semibold text-foreground">
                        {reviewQueue.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 wrap-anywhere text-muted-foreground">
                        {reviewQueue.description}
                    </p>
                </div>
            </div>
        </section>
    );
}
