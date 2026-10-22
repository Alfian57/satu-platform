import { Skeleton } from '@/components/ui/skeleton';

export function DiscussionSkeleton() {
    return (
        <div
            className="grid gap-4 border-b border-border py-4"
            aria-hidden="true"
        >
            <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="grid flex-1 gap-2">
                    <Skeleton className="h-3 w-2/5" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
            <Skeleton className="ml-12 h-12 w-[calc(100%-3rem)]" />
        </div>
    );
}
