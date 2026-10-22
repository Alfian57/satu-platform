import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LeaderboardPaginationProps {
    page: number;
    totalPages: number;
    busy: boolean;
    onPageChange: (nextPage: number) => void;
}

export function LeaderboardPagination({
    page,
    totalPages,
    busy,
    onPageChange,
}: LeaderboardPaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
                Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={busy || page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    data-test="leaderboard-previous-page"
                >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                    Sebelumnya
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={busy || page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    data-test="leaderboard-next-page"
                >
                    Berikutnya
                    <ChevronRight aria-hidden="true" className="size-4" />
                </Button>
            </div>
        </div>
    );
}
