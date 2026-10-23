import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
    DiscoveryFilters,
    FilterOptions,
} from '@/pages/projects/index/_components/catalog-utils';
import { ProjectAdvancedFilterFields } from '@/pages/projects/index/_components/project-advanced-filter-fields';
import { ProjectAppliedFilters } from '@/pages/projects/index/_components/project-applied-filters';
import { ProjectBeginnerShortcut } from '@/pages/projects/index/_components/project-beginner-shortcut';
import type { QueryParams } from '@/wayfinder';

export type ProjectCatalogFiltersProps = {
    isMine: boolean;
    filters: DiscoveryFilters;
    filterOptions: FilterOptions;
    searchQuery: string;
    selectedStatuses: string[];
    selectedVisibilities: string[];
    selectedSort: string;
    selectedDirection: string;
    selectedPerPage: number;
    selectedBeginner: 'all' | 'accepting';
    selectedAvailability: 'all' | 'available';
    isPending: boolean;
    actions: {
        setSearchQuery: (query: string) => void;
        setSelectedBeginner: (value: 'all' | 'accepting') => void;
        setSelectedAvailability: (value: 'all' | 'available') => void;
        setSelectedSort: (value: string) => void;
        setSelectedDirection: (value: string) => void;
        setSelectedPerPage: (value: number) => void;
        toggleStatus: (status: string, checked: boolean) => void;
        toggleVisibility: (visibility: string, checked: boolean) => void;
        visitDiscovery: () => void;
        visitQuery: (query: QueryParams) => void;
        resetFilters: () => void;
    };
};

export function ProjectCatalogFilters({
    isMine,
    filters,
    filterOptions,
    searchQuery,
    selectedStatuses,
    selectedVisibilities,
    selectedSort,
    selectedDirection,
    selectedPerPage,
    selectedBeginner,
    selectedAvailability,
    isPending,
    actions,
}: ProjectCatalogFiltersProps) {
    return (
        <section
            aria-labelledby="project-filters-title"
            data-test="project-filters"
            className="project-discovery-search min-w-0 rounded-xl border border-border bg-card shadow-sm"
        >
            <form
                className="grid gap-4 p-4 sm:p-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    actions.visitDiscovery();
                }}
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <div>
                                <h2
                                    id="project-filters-title"
                                    className="text-lg font-bold tracking-tight text-foreground"
                                >
                                    {isMine
                                        ? 'Cari dalam proyekmu'
                                        : 'Mulai dari peran yang kamu minati'}
                                </h2>
                            </div>
                        </div>
                        <div className="relative mt-3">
                            <Search
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                id="project-search"
                                value={searchQuery}
                                onChange={(event) =>
                                    actions.setSearchQuery(event.target.value)
                                }
                                aria-label="Cari proyek berdasarkan judul, peran, atau keahlian"
                                placeholder="Cari judul, peran, atau keahlian"
                                className="h-12 min-w-0 border-input bg-background/60 pl-11 text-base shadow-none hover:border-ring"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="h-12 w-full shrink-0 px-5 lg:w-auto"
                        data-test="project-apply-filters"
                    >
                        <Filter aria-hidden="true" />
                        Terapkan filter
                    </Button>
                </div>

                {!isMine && (
                    <ProjectBeginnerShortcut
                        filters={filters}
                        isPending={isPending}
                        onVisitQuery={actions.visitQuery}
                    />
                )}

                <ProjectAdvancedFilterFields
                    filters={filters}
                    filterOptions={filterOptions}
                    selectedStatuses={selectedStatuses}
                    selectedVisibilities={selectedVisibilities}
                    selectedSort={selectedSort}
                    selectedDirection={selectedDirection}
                    selectedPerPage={selectedPerPage}
                    selectedBeginner={selectedBeginner}
                    selectedAvailability={selectedAvailability}
                    isPending={isPending}
                    onSetSelectedBeginner={actions.setSelectedBeginner}
                    onSetSelectedAvailability={actions.setSelectedAvailability}
                    onSetSelectedSort={actions.setSelectedSort}
                    onSetSelectedDirection={actions.setSelectedDirection}
                    onSetSelectedPerPage={actions.setSelectedPerPage}
                    onToggleStatus={actions.toggleStatus}
                    onToggleVisibility={actions.toggleVisibility}
                    onResetFilters={actions.resetFilters}
                />

                <ProjectAppliedFilters filters={filters} />
            </form>
        </section>
    );
}
