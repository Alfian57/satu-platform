import { Button } from '@/components/ui/button';

interface IntegrationPaginationProps {
    currentPage: number;
    lastPage: number;
    disabled: boolean;
    onPageChange: (page: number) => void;
}

export function IntegrationPagination({
    currentPage,
    lastPage,
    disabled,
    onPageChange,
}: IntegrationPaginationProps) {
    if (lastPage <= 1) {
        return null;
    }

    return (
        <nav
            aria-label="Paginasi sinkronisasi akademik"
            className="flex flex-wrap items-center justify-between gap-3"
        >
            <p className="text-xs text-muted-foreground">
                Halaman {currentPage} dari {lastPage}
            </p>
            <div className="flex flex-wrap gap-2">
                <Button
                    variant="outline"
                    disabled={disabled || currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    Sebelumnya
                </Button>
                <Button
                    variant="outline"
                    disabled={disabled || currentPage === lastPage}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Berikutnya
                </Button>
            </div>
        </nav>
    );
}
