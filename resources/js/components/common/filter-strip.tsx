import { RotateCcw, Search, X } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FilterStripProps {
    search?: string;
    onSearchChange?: (val: string) => void;
    searchPlaceholder?: string;
    searchLabel?: string;
    onSearchSubmit?: () => void;
    filters?: ReactNode;
    actions?: ReactNode;
    activeFilterCount?: number;
    onReset?: () => void;
    resetLabel?: string;
    isPending?: boolean;
    className?: string;
}

export function FilterStrip({
    search,
    onSearchChange,
    searchPlaceholder = 'Cari data...',
    searchLabel = 'Pencarian',
    onSearchSubmit,
    filters,
    actions,
    activeFilterCount,
    onReset,
    resetLabel = 'Atur ulang',
    isPending = false,
    className,
}: FilterStripProps) {
    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        onSearchSubmit?.();
    }

    return (
        <section
            data-slot="filter-strip"
            aria-label="Penyaringan dan pencarian"
            className={cn(
                'flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
        >
            <form
                role="search"
                onSubmit={handleSubmit}
                className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center"
            >
                {onSearchChange && (
                    <div className="relative min-w-0 flex-1 sm:max-w-xs">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            type="search"
                            value={search ?? ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            aria-label={searchLabel}
                            disabled={isPending}
                            className="h-control-md pr-9 pl-10 text-sm"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                disabled={isPending}
                                aria-label="Hapus teks pencarian"
                                className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                            >
                                <X aria-hidden="true" className="size-3.5" />
                            </button>
                        )}
                    </div>
                )}

                {filters && (
                    <div className="flex flex-wrap items-center gap-2">
                        {filters}
                    </div>
                )}
            </form>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {onReset && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={onReset}
                        className="min-h-11 cursor-pointer text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                    >
                        <RotateCcw aria-hidden="true" className="size-3.5" />
                        <span>{resetLabel}</span>
                        {typeof activeFilterCount === 'number' &&
                            activeFilterCount > 0 && (
                                <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                                    {activeFilterCount}
                                </span>
                            )}
                    </Button>
                )}

                {actions}
            </div>
        </section>
    );
}
