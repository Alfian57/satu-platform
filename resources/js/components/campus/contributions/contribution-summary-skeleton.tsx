import { Skeleton } from '@/components/ui/skeleton';

export function ContributionSummarySkeleton() {
    return (
        <div aria-busy="true" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <p role="status" className="sr-only">
                Memuat ringkasan validasi.
            </p>
            {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-16 w-full rounded-3xl" />
            ))}
        </div>
    );
}
