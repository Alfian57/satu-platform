import type {
    DiscoveryFilters,
    FilterOptions,
} from '@/components/projects/catalog/catalog-utils';
import { selectClassName } from '@/components/projects/catalog/catalog-utils';
import { Label } from '@/components/ui/label';

export function ProjectFilterSortGrid({
    filters,
    filterOptions,
    selectedSort,
    selectedDirection,
    selectedPerPage,
    onSetSelectedSort,
    onSetSelectedDirection,
    onSetSelectedPerPage,
}: {
    filters: DiscoveryFilters;
    filterOptions: FilterOptions;
    selectedSort: string;
    selectedDirection: string;
    selectedPerPage: number;
    onSetSelectedSort: (val: string) => void;
    onSetSelectedDirection: (val: string) => void;
    onSetSelectedPerPage: (val: number) => void;
}) {
    return (
        <div className="grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-3">
            <div className="min-w-0 space-y-2">
                <Label
                    htmlFor="project-sort"
                    className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >
                    Urutkan berdasarkan
                </Label>
                <select
                    id="project-sort"
                    className={selectClassName}
                    value={selectedSort}
                    onChange={(event) => onSetSelectedSort(event.target.value)}
                >
                    {filterOptions.sort.map((sort) => (
                        <option key={sort} value={sort}>
                            {sort === 'deadline'
                                ? 'Batas waktu'
                                : sort === 'newest'
                                  ? 'Proyek terbaru'
                                  : sort === 'title'
                                    ? 'Judul proyek'
                                    : sort}
                        </option>
                    ))}
                </select>
            </div>
            <div className="min-w-0 space-y-2">
                <Label
                    htmlFor="project-direction"
                    className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >
                    Arah urutan
                </Label>
                <select
                    id="project-direction"
                    className={selectClassName}
                    value={selectedDirection}
                    onChange={(event) =>
                        onSetSelectedDirection(event.target.value)
                    }
                >
                    {filterOptions.direction.map((direction) => (
                        <option key={direction} value={direction}>
                            {direction === 'asc' ? 'Naik' : 'Turun'}
                        </option>
                    ))}
                </select>
            </div>
            <div className="min-w-0 space-y-2">
                <Label
                    htmlFor="project-per-page"
                    className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >
                    Hasil per halaman
                </Label>
                <select
                    id="project-per-page"
                    className={selectClassName}
                    value={selectedPerPage}
                    onChange={(event) =>
                        onSetSelectedPerPage(Number(event.target.value))
                    }
                >
                    {Array.from(
                        new Set([
                            filterOptions.per_page.default,
                            filters.per_page,
                            10,
                            20,
                            50,
                        ]),
                    )
                        .filter(
                            (amount) => amount <= filterOptions.per_page.max,
                        )
                        .map((amount) => (
                            <option key={amount} value={amount}>
                                {amount} proyek
                            </option>
                        ))}
                </select>
            </div>
        </div>
    );
}
