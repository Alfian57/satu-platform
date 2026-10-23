import { Skeleton } from '@/components/ui/skeleton';

export function ContributionQueueSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Antrean validasi kontribusi sedang dimuat"
            className="overflow-hidden rounded-3xl border border-border bg-white"
            data-test="campus-contribution-queue-loading"
        >
            <p className="sr-only" role="status">
                Memuat antrean validasi kontribusi.
            </p>
            {Array.from({ length: 5 }, (_, index) => (
                <div
                    key={index}
                    aria-hidden="true"
                    className="grid min-h-24 gap-4 border-b border-border p-6 last:border-b-0 @min-[46rem]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_9rem] @min-[46rem]:items-center"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-xl bg-accent" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32 bg-accent" />
                            <Skeleton className="h-3 w-48 bg-accent" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28 bg-accent" />
                        <Skeleton className="h-3 w-36 bg-accent" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-xl bg-accent" />
                </div>
            ))}
        </div>
    );
}
