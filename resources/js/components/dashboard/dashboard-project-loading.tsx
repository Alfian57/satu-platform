import { Skeleton } from '@/components/ui/skeleton';

export function DashboardProjectLoading({
    announcement,
}: {
    announcement: string;
}) {
    return (
        <div
            aria-busy="true"
            aria-live="polite"
            className="rounded-3xl border border-border bg-card px-2 sm:px-3"
            data-test="dashboard-projects-loading"
            role="status"
        >
            <span className="sr-only">{announcement}</span>
            <div aria-hidden="true" className="grid">
                {[0, 1].map((index) => (
                    <div
                        key={index}
                        className="flex min-h-44 items-start gap-3 border-b border-border/60 p-4 last:border-b-0 sm:items-center sm:p-5"
                    >
                        <Skeleton className="size-11 shrink-0 rounded-2xl sm:size-12" />
                        <div className="grid min-w-0 flex-1 gap-2">
                            <Skeleton className="h-5 w-4/5" />
                            <Skeleton className="h-3 w-1/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-6 w-1/2 rounded-lg" />
                        </div>
                        <Skeleton className="size-8 shrink-0 rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}
