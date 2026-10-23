import { RefreshCw } from 'lucide-react';

export function ContributionQueueRefreshState() {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="flex items-center gap-2.5 rounded-3xl border border-primary/15 bg-accent/70 p-4 text-xs font-semibold text-primary"
            data-test="campus-contribution-queue-refreshing"
        >
            <RefreshCw
                aria-hidden="true"
                className="size-4 animate-spin text-primary motion-reduce:animate-none"
            />
            <span>
                Menyegarkan antrean tanpa menghapus kontribusi yang sedang
                terlihat.
            </span>
        </div>
    );
}
