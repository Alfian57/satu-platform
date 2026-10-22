import { Skeleton } from '@/components/ui/skeleton';

export function AffiliationQueueSkeleton() {
    return (
        <div
            aria-busy="true"
            className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
            data-test="affiliation-queue-skeleton"
        >
            <p className="sr-only" role="status">
                Memuat antrean afiliasi.
            </p>
            <div aria-hidden="true" className="min-w-0 space-y-3">
                <Skeleton className="h-11 w-52 max-w-full motion-reduce:animate-none" />
                {[1, 2, 3].map((key) => (
                    <div
                        key={key}
                        className="rounded-3xl border border-border bg-white p-5"
                    >
                        <Skeleton className="h-5 w-36 motion-reduce:animate-none" />
                        <Skeleton className="mt-3 h-5 w-3/4 motion-reduce:animate-none" />
                        <Skeleton className="mt-3 h-7 w-44 max-w-full rounded-full motion-reduce:animate-none" />
                        <Skeleton className="mt-4 h-11 w-36 motion-reduce:animate-none" />
                    </div>
                ))}
            </div>
            <div aria-hidden="true" className="min-w-0 space-y-4">
                <Skeleton className="h-44 w-full rounded-3xl motion-reduce:animate-none" />
                <Skeleton className="h-64 w-full rounded-3xl motion-reduce:animate-none" />
            </div>
        </div>
    );
}
