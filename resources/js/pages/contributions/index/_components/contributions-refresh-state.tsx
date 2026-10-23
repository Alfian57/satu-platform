import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function ContributionsRefreshState() {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            data-test="contributions-loading"
            className="grid min-w-0 gap-4"
        >
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                />
                Memuat pembaruan kontribusi. Catatan sebelumnya tetap terlihat.
            </p>
            <div
                aria-hidden="true"
                className="grid min-w-0 gap-5 xl:grid-cols-2"
            >
                {[1, 2].map((item) => (
                    <div
                        key={item}
                        className="grid min-w-0 gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6"
                    >
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-4/5" />
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-28 w-full rounded-2xl" />
                        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}
