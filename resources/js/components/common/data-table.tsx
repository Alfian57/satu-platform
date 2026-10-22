import type { KeyboardEvent, ReactNode } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface DataTableColumn<TData> {
    id: string;
    header: ReactNode;
    cell: (row: TData, index: number) => ReactNode;
    className?: string;
    headerClassName?: string;
    align?: 'left' | 'center' | 'right';
    width?: string;
}

export interface DataTableProps<TData> {
    data: TData[];
    columns: DataTableColumn<TData>[];
    keyExtractor: (row: TData, index: number) => string | number;
    caption?: string;
    captionVisible?: boolean;
    loading?: boolean;
    loadingRowsCount?: number;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyState?: ReactNode;
    onRowClick?: (row: TData) => void;
    rowClassName?: (row: TData, index: number) => string | undefined;
    className?: string;
}

export function DataTable<TData>({
    data,
    columns,
    keyExtractor,
    caption,
    captionVisible = false,
    loading = false,
    loadingRowsCount = 3,
    emptyTitle = 'Belum ada data',
    emptyDescription = 'Tidak ada catatan yang tersedia pada tabel ini.',
    emptyState,
    onRowClick,
    rowClassName,
    className,
}: DataTableProps<TData>) {
    const alignClass: Record<'left' | 'center' | 'right', string> = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    function handleRowKeyDown(
        event: KeyboardEvent<HTMLTableRowElement>,
        row: TData,
    ) {
        if (!onRowClick) {
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onRowClick(row);
        }
    }

    return (
        <div
            role="region"
            tabIndex={0}
            aria-label={caption || 'Tabel data'}
            className={cn(
                'max-w-full overflow-x-auto rounded-3xl border border-border bg-card shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
                className,
            )}
        >
            <table className="w-full border-collapse text-left text-sm">
                {caption && (
                    <caption
                        className={cn(
                            'px-5 pt-4 pb-2 text-left text-sm font-semibold text-foreground',
                            !captionVisible && 'sr-only',
                        )}
                    >
                        {caption}
                    </caption>
                )}
                <thead>
                    <tr className="border-b border-border bg-accent/40 text-muted-foreground">
                        {columns.map((column) => (
                            <th
                                key={column.id}
                                scope="col"
                                style={
                                    column.width
                                        ? { width: column.width }
                                        : undefined
                                }
                                className={cn(
                                    'px-5 py-3.5 text-xs font-semibold tracking-wide',
                                    alignClass[column.align ?? 'left'],
                                    column.headerClassName,
                                )}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                    {loading ? (
                        Array.from({ length: loadingRowsCount }).map(
                            (_, rowIndex) => (
                                <tr key={`loading-${rowIndex}`}>
                                    {columns.map((column) => (
                                        <td
                                            key={`loading-${rowIndex}-${column.id}`}
                                            className={cn(
                                                'px-5 py-4',
                                                column.className,
                                            )}
                                        >
                                            <Skeleton className="h-4 w-3/4 rounded-md motion-reduce:animate-none" />
                                        </td>
                                    ))}
                                </tr>
                            ),
                        )
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="p-8">
                                {emptyState ?? (
                                    <EmptyState
                                        title={emptyTitle}
                                        description={emptyDescription}
                                        borderStyle="none"
                                    />
                                )}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, index) => {
                            const isClickable = Boolean(onRowClick);

                            return (
                                <tr
                                    key={keyExtractor(row, index)}
                                    tabIndex={isClickable ? 0 : undefined}
                                    role={isClickable ? 'button' : undefined}
                                    onClick={
                                        isClickable
                                            ? () => onRowClick?.(row)
                                            : undefined
                                    }
                                    onKeyDown={
                                        isClickable
                                            ? (e) => handleRowKeyDown(e, row)
                                            : undefined
                                    }
                                    className={cn(
                                        'transition-colors',
                                        isClickable
                                            ? 'cursor-pointer hover:bg-accent/35 focus-visible:bg-accent/40 focus-visible:outline-none'
                                            : 'hover:bg-accent/20',
                                        rowClassName?.(row, index),
                                    )}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.id}
                                            className={cn(
                                                'px-5 py-4 align-middle text-sm [overflow-wrap:anywhere] text-foreground',
                                                alignClass[
                                                    column.align ?? 'left'
                                                ],
                                                column.className,
                                            )}
                                        >
                                            {column.cell(row, index)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
