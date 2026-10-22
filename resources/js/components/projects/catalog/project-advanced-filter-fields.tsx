import { ChevronRight, Filter } from 'lucide-react';
import type {
    DiscoveryFilters,
    FilterOptions,
} from '@/components/projects/catalog/catalog-utils';
import {
    displayStatus,
    displayVisibility,
    selectClassName,
} from '@/components/projects/catalog/catalog-utils';
import { ProjectFilterSortGrid } from '@/components/projects/catalog/project-filter-sort-grid';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function ProjectAdvancedFilterFields({
    filters,
    filterOptions,
    selectedStatuses,
    selectedVisibilities,
    selectedSort,
    selectedDirection,
    selectedPerPage,
    selectedBeginner,
    selectedAvailability,
    isPending,
    onSetSelectedBeginner,
    onSetSelectedAvailability,
    onSetSelectedSort,
    onSetSelectedDirection,
    onSetSelectedPerPage,
    onToggleStatus,
    onToggleVisibility,
    onResetFilters,
}: {
    filters: DiscoveryFilters;
    filterOptions: FilterOptions;
    selectedStatuses: string[];
    selectedVisibilities: string[];
    selectedSort: string;
    selectedDirection: string;
    selectedPerPage: number;
    selectedBeginner: 'all' | 'accepting';
    selectedAvailability: 'all' | 'available';
    isPending: boolean;
    onSetSelectedBeginner: (val: 'all' | 'accepting') => void;
    onSetSelectedAvailability: (val: 'all' | 'available') => void;
    onSetSelectedSort: (val: string) => void;
    onSetSelectedDirection: (val: string) => void;
    onSetSelectedPerPage: (val: number) => void;
    onToggleStatus: (status: string, checked: boolean) => void;
    onToggleVisibility: (visibility: string, checked: boolean) => void;
    onResetFilters: () => void;
}) {
    return (
        <details
            className="min-w-0 border-t border-border/60 pt-4"
            data-test="project-advanced-filters"
        >
            <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-2 rounded-xl px-3 text-sm font-semibold text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:transition-colors motion-safe:duration-standard [&::-webkit-details-marker]:hidden">
                <Filter aria-hidden="true" className="size-4" />
                Filter tambahan
                <ChevronRight
                    aria-hidden="true"
                    className="ml-auto size-4 in-open:rotate-90 motion-safe:transition-transform motion-safe:duration-standard"
                />
            </summary>
            <div className="mt-4 grid gap-5 lg:grid-cols-2">
                <div className="min-w-0 space-y-2">
                    <Label htmlFor="project-beginner-filter">
                        Penerimaan pemula
                    </Label>
                    <select
                        id="project-beginner-filter"
                        className={selectClassName}
                        value={selectedBeginner}
                        disabled={isPending}
                        onChange={(event) =>
                            onSetSelectedBeginner(
                                event.target.value as 'all' | 'accepting',
                            )
                        }
                        aria-describedby="project-beginner-help"
                    >
                        <option value="all">Semua peran</option>
                        <option value="accepting">Menerima pemula</option>
                    </select>
                    <p
                        id="project-beginner-help"
                        className="text-xs leading-5 text-muted-foreground"
                    >
                        Mengikuti pernyataan pemilik. Bukan jaminan diterima dan
                        tidak mensyaratkan karya terdahulu.
                    </p>
                </div>
                <div className="min-w-0 space-y-2">
                    <Label htmlFor="project-availability-filter">
                        Tempat tersedia
                    </Label>
                    <select
                        id="project-availability-filter"
                        className={selectClassName}
                        value={selectedAvailability}
                        disabled={isPending}
                        onChange={(event) =>
                            onSetSelectedAvailability(
                                event.target.value as 'all' | 'available',
                            )
                        }
                        aria-describedby="project-availability-help"
                    >
                        <option value="all">Semua keadaan</option>
                        <option value="available">
                            Masih menerima pengajuan
                        </option>
                    </select>
                    <p
                        id="project-availability-help"
                        className="text-xs leading-5 text-muted-foreground"
                    >
                        Tenggat belum lewat dan ada tempat pada tim serta peran.
                        Pengajuan pending tidak memesan tempat.
                    </p>
                </div>
                <fieldset className="min-w-0 space-y-3">
                    <legend className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Status proyek
                    </legend>
                    <div className="flex flex-wrap gap-2">
                        {filterOptions.status.map((status) => (
                            <div
                                key={status}
                                className={cn(
                                    'flex min-h-11 max-w-full items-center gap-2 rounded-xl border px-3 py-1 text-sm transition-colors duration-fast motion-reduce:transition-none',
                                    selectedStatuses.includes(status)
                                        ? 'border-primary/30 bg-accent text-primary'
                                        : 'border-border bg-card text-muted-foreground',
                                )}
                            >
                                <Checkbox
                                    id={`status-${status}`}
                                    checked={selectedStatuses.includes(status)}
                                    onCheckedChange={(checked) =>
                                        onToggleStatus(status, checked === true)
                                    }
                                />
                                <Label
                                    htmlFor={`status-${status}`}
                                    className="flex min-h-11 min-w-0 cursor-pointer items-center text-sm font-medium wrap-anywhere"
                                >
                                    {displayStatus(status)}
                                </Label>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                        Pilih minimal satu status.
                    </p>
                </fieldset>

                <fieldset className="min-w-0 space-y-3">
                    <legend className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Visibilitas
                    </legend>
                    <div className="flex flex-wrap gap-2">
                        {filterOptions.visibility.map((visibility) => (
                            <div
                                key={visibility}
                                className={cn(
                                    'flex min-h-11 max-w-full items-center gap-2 rounded-xl border px-3 py-1 text-sm transition-colors duration-fast motion-reduce:transition-none',
                                    selectedVisibilities.includes(visibility)
                                        ? 'border-primary/30 bg-accent text-primary'
                                        : 'border-border bg-card text-muted-foreground',
                                )}
                            >
                                <Checkbox
                                    id={`visibility-${visibility}`}
                                    checked={selectedVisibilities.includes(
                                        visibility,
                                    )}
                                    onCheckedChange={(checked) =>
                                        onToggleVisibility(
                                            visibility,
                                            checked === true,
                                        )
                                    }
                                />
                                <Label
                                    htmlFor={`visibility-${visibility}`}
                                    className="flex min-h-11 min-w-0 cursor-pointer items-center text-sm font-medium wrap-anywhere"
                                >
                                    {displayVisibility(visibility)}
                                </Label>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                        Proyek pribadi hanya muncul jika kamu pemiliknya.
                    </p>
                </fieldset>
            </div>

            <ProjectFilterSortGrid
                filters={filters}
                filterOptions={filterOptions}
                selectedSort={selectedSort}
                selectedDirection={selectedDirection}
                selectedPerPage={selectedPerPage}
                onSetSelectedSort={onSetSelectedSort}
                onSetSelectedDirection={onSetSelectedDirection}
                onSetSelectedPerPage={onSetSelectedPerPage}
            />

            <Button
                type="button"
                variant="ghost"
                onClick={onResetFilters}
                disabled={isPending}
                className="mt-4 min-h-11 w-full text-muted-foreground sm:w-auto"
            >
                Atur ulang filter
            </Button>
        </details>
    );
}
