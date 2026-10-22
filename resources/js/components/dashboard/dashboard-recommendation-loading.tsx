import { Skeleton } from '@/components/ui/skeleton';

export function DashboardRecommendationLoading({
    announcement,
}: {
    announcement: string;
}) {
    return (
        <div
            aria-busy="true"
            aria-live="polite"
            className="mt-4 border-t border-border/50 pt-4"
            data-test="dashboard-recommendation-loading"
            role="status"
        >
            <span className="sr-only">{announcement}</span>
            <div aria-hidden="true" className="grid gap-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-2xl" />
                    <div className="grid w-full gap-1.5">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-11 w-full rounded-xl" />
            </div>
        </div>
    );
}
