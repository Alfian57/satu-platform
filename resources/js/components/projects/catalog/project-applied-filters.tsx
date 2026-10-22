import {
    displayStatus,
    displayVisibility,
} from '@/components/projects/catalog/catalog-utils';
import type { DiscoveryFilters } from '@/components/projects/catalog/catalog-utils';

export function ProjectAppliedFilters({
    filters,
}: {
    filters: DiscoveryFilters;
}) {
    return (
        <div
            className="flex min-w-0 flex-wrap items-center gap-2 border-t border-border/60 pt-4"
            aria-label="Filter yang diterapkan"
            data-test="project-applied-filters"
        >
            <span className="text-xs text-muted-foreground">Diterapkan:</span>
            {filters.q && (
                <span className="max-w-full rounded-lg bg-background px-2.5 py-1.5 text-xs wrap-anywhere text-foreground">
                    Pencarian: {filters.q}
                </span>
            )}
            {filters.beginner === 'accepting' && (
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
                    Menerima pemula
                </span>
            )}
            {filters.availability === 'available' && (
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
                    Masih menerima pengajuan
                </span>
            )}
            {filters.status.map((value) => (
                <span
                    key={value}
                    className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-primary"
                >
                    {displayStatus(value)}
                </span>
            ))}
            {filters.visibility.map((value) => (
                <span
                    key={value}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground"
                >
                    {displayVisibility(value)}
                </span>
            ))}
        </div>
    );
}
