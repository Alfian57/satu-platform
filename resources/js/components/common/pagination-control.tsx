import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    from?: number;
    to?: number;
    total: number;
    per_page?: number;
}

export interface PaginationControlProps {
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    itemName?: string;
    disabled?: boolean;
    className?: string;
    showPageNumbers?: boolean;
}

function getPageNumbers(currentPage: number, lastPage: number): number[] {
    if (lastPage <= 5) {
        return Array.from({ length: lastPage }, (_, i) => i + 1);
    }

    const start = Math.max(1, Math.min(currentPage - 1, lastPage - 3));
    const end = Math.min(lastPage, start + 3);

    const pages: number[] = [];

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return pages;
}

export function PaginationControl({
    meta,
    onPageChange,
    itemName = 'data',
    disabled = false,
    className,
    showPageNumbers = true,
}: PaginationControlProps) {
    const { current_page, last_page, total, per_page = 10 } = meta;

    if (total === 0) {
        return (
            <div
                className={cn(
                    'flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground',
                    className,
                )}
            >
                <p>Tidak ada {itemName}.</p>
            </div>
        );
    }

    const from = meta.from ?? (current_page - 1) * per_page + 1;
    const to = meta.to ?? Math.min(total, current_page * per_page);

    const pages = getPageNumbers(current_page, last_page);

    return (
        <nav
            role="navigation"
            aria-label="Navigasi halaman"
            className={cn(
                'flex flex-col gap-3 border-t border-border pt-4 text-sm sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
        >
            <p className="text-muted-foreground">
                {last_page <= 1
                    ? `Menampilkan ${total} ${itemName}`
                    : `Menampilkan ${from}-${to} dari ${total} ${itemName}`}
            </p>

            {last_page > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled || current_page <= 1}
                        onClick={() => onPageChange(current_page - 1)}
                        aria-label="Halaman sebelumnya"
                        className="min-h-11 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <ChevronLeft aria-hidden="true" className="size-4" />
                        <span>Sebelumnya</span>
                    </Button>

                    {showPageNumbers &&
                        pages.map((page) => (
                            <Button
                                key={page}
                                type="button"
                                size="sm"
                                variant={
                                    page === current_page
                                        ? 'default'
                                        : 'outline'
                                }
                                disabled={disabled}
                                aria-current={
                                    page === current_page ? 'page' : undefined
                                }
                                aria-label={`Buka halaman ${page}`}
                                onClick={() => onPageChange(page)}
                                className="min-h-11 min-w-11 cursor-pointer font-medium disabled:cursor-not-allowed"
                            >
                                {page}
                            </Button>
                        ))}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled || current_page >= last_page}
                        onClick={() => onPageChange(current_page + 1)}
                        aria-label="Halaman berikutnya"
                        className="min-h-11 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <span>Berikutnya</span>
                        <ChevronRight aria-hidden="true" className="size-4" />
                    </Button>
                </div>
            )}
        </nav>
    );
}
