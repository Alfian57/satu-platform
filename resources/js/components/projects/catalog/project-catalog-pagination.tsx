import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pageNumbers } from '@/components/projects/catalog/catalog-utils';
import { Button } from '@/components/ui/button';

export function ProjectCatalogPagination({
    currentPage,
    lastPage,
    isPending,
    onPageChange,
}: {
    currentPage: number;
    lastPage: number;
    isPending: boolean;
    onPageChange: (page: number) => void;
}) {
    if (lastPage <= 1) {
        return null;
    }

    return (
        <nav
            aria-label="Navigasi halaman proyek"
            data-test="project-pagination"
            className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <p className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {lastPage}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending || currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    aria-label="Halaman sebelumnya"
                    className="min-h-11"
                >
                    <ChevronLeft aria-hidden="true" />
                    Sebelumnya
                </Button>
                {pageNumbers(currentPage, lastPage).map((page) => (
                    <Button
                        key={page}
                        type="button"
                        size="sm"
                        variant={page === currentPage ? 'default' : 'outline'}
                        disabled={isPending}
                        aria-current={page === currentPage ? 'page' : undefined}
                        aria-label={`Buka halaman ${page}`}
                        onClick={() => onPageChange(page)}
                        className="min-h-11 min-w-11"
                    >
                        {page}
                    </Button>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending || currentPage >= lastPage}
                    onClick={() => onPageChange(currentPage + 1)}
                    aria-label="Halaman berikutnya"
                    className="min-h-11"
                >
                    Berikutnya
                    <ChevronRight aria-hidden="true" />
                </Button>
            </div>
        </nav>
    );
}
