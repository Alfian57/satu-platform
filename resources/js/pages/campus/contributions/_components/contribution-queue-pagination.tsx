import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewQueue } from '@/pages/campus/contributions/_types/contribution-types';

interface ContributionQueuePaginationProps {
    pagination: ReviewQueue['pagination'];
    isLoading: boolean;
    onUpdatePage: (page: number) => void;
}

export function ContributionQueuePagination({
    pagination,
    isLoading,
    onUpdatePage,
}: ContributionQueuePaginationProps) {
    if (pagination.last_page <= 1) {
        return null;
    }

    return (
        <nav
            aria-label="Paginasi antrean validasi kontribusi"
            className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-white p-4 shadow-sm"
        >
            <Button
                type="button"
                variant="outline"
                className="cursor-pointer rounded-xl text-xs font-semibold disabled:cursor-not-allowed"
                disabled={isLoading || pagination.current_page === 1}
                onClick={() => onUpdatePage(pagination.current_page - 1)}
            >
                <ChevronLeft className="mr-1 size-3.5" />
                Sebelumnya
            </Button>
            <p className="font-mono text-xs font-semibold text-muted-foreground">
                Halaman {pagination.current_page} dari {pagination.last_page}
            </p>
            <Button
                type="button"
                variant="outline"
                className="cursor-pointer rounded-xl text-xs font-semibold disabled:cursor-not-allowed"
                disabled={
                    isLoading ||
                    pagination.current_page === pagination.last_page
                }
                onClick={() => onUpdatePage(pagination.current_page + 1)}
            >
                Berikutnya
                <ChevronRight className="ml-1 size-3.5" />
            </Button>
        </nav>
    );
}
