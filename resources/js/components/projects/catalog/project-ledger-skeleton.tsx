import { Skeleton } from '@/components/ui/skeleton';

export function ProjectLedgerSkeleton() {
    return (
        <li
            aria-hidden="true"
            data-test="project-skeleton-row"
            className="grid min-w-0 gap-4 rounded-xl border border-border bg-card p-4 sm:p-5"
        >
            <div className="grid gap-5">
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-6 w-3/5 max-w-sm" />
                    <Skeleton className="h-4 w-full max-w-2xl" />
                    <Skeleton className="h-4 w-4/5 max-w-xl" />
                    <div className="grid gap-3 rounded-xl bg-accent/50 p-3.5">
                        <Skeleton className="h-4 w-36" />
                        <div className="grid gap-2.5">
                            <Skeleton className="h-12 w-4/5 rounded-lg" />
                            <Skeleton className="h-12 w-3/5 rounded-lg" />
                        </div>
                        <Skeleton className="h-3 w-4/5" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-7 w-4/5 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-border/70 pt-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="col-span-2 h-4 w-36" />
                </div>
                <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-11 w-32 rounded-xl" />
                </div>
            </div>
        </li>
    );
}
