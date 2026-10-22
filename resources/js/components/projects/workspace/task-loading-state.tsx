import { Skeleton } from '@/components/ui/skeleton';

export function TaskLoadingState() {
    return (
        <div
            data-test="workspace-refresh-skeleton"
            role="region"
            aria-busy="true"
            aria-label="Daftar tugas sedang dimuat"
            className="grid gap-3 border-y border-border py-4"
        >
            <div aria-hidden="true" className="grid gap-3">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
}
