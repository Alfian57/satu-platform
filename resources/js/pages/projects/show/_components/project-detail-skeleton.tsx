import { Skeleton } from '@/components/ui/skeleton';

export function ProjectDetailSkeleton() {
    return (
        <div
            data-test="project-detail-skeleton"
            aria-hidden="true"
            className="grid gap-6 rounded-3xl border border-border bg-card p-5 sm:p-6"
        >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-4/5" />
            <div className="grid gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((item) => (
                    <Skeleton key={item} className="h-16" />
                ))}
            </div>
        </div>
    );
}
