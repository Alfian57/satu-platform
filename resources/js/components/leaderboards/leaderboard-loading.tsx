import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface LeaderboardLoadingProps {
    refreshing?: boolean;
}

export function LeaderboardLoading({
    refreshing = false,
}: LeaderboardLoadingProps) {
    return (
        <div
            aria-busy="true"
            className="grid min-w-0 gap-4 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-6"
            data-test={
                refreshing
                    ? 'leaderboard-refresh-loading'
                    : 'leaderboard-loading'
            }
        >
            <p
                role="status"
                className="flex items-center gap-2 text-sm text-muted-foreground"
            >
                <RefreshCw
                    aria-hidden="true"
                    className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
                />
                {refreshing
                    ? 'Memperbarui hasil. Data sebelumnya tetap terlihat.'
                    : 'Memuat peringkat terverifikasi.'}
            </p>
            <div aria-hidden="true" className="grid min-w-0 gap-4">
                {Array.from({ length: refreshing ? 1 : 4 }, (_, index) => (
                    <div
                        key={index}
                        className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] gap-4 border-t border-border py-5"
                    >
                        <Skeleton className="size-12 rounded-2xl" />
                        <div className="grid min-w-0 gap-3">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
