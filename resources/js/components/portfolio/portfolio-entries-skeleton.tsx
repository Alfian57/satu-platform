import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PortfolioEntriesSkeleton({
    refreshing = false,
}: {
    refreshing?: boolean;
}) {
    return (
        <div
            role="region"
            aria-busy="true"
            aria-label="Daftar portofolio sedang dimuat"
            data-test={
                refreshing ? 'portfolio-refresh-skeleton' : 'portfolio-loading'
            }
            className="grid min-w-0 gap-5"
        >
            <p
                role="status"
                className="flex items-center gap-2 text-sm text-muted-foreground"
            >
                <RefreshCw
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                />
                {refreshing
                    ? 'Memperbarui koleksi. Karyamu tetap terlihat.'
                    : 'Memuat koleksi portofolio.'}
            </p>
            <div
                aria-hidden="true"
                className="grid min-w-0 gap-5 2xl:grid-cols-2"
            >
                {[1, 2].map((row) => (
                    <div
                        key={row}
                        className="grid min-w-0 gap-5 rounded-3xl border border-border bg-card p-5 sm:p-7"
                    >
                        <div className="flex justify-between gap-3">
                            <Skeleton className="size-11 rounded-2xl" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}
