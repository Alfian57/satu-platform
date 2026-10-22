import type { ProjectPagination } from '@/components/projects/catalog/catalog-utils';
import { ProjectCatalogPagination } from '@/components/projects/catalog/project-catalog-pagination';
import { ProjectEmptyState } from '@/components/projects/catalog/project-empty-state';
import { ProjectErrorState } from '@/components/projects/catalog/project-error-state';
import { ProjectLedgerRow } from '@/components/projects/catalog/project-ledger-row';
import { ProjectLedgerSkeleton } from '@/components/projects/catalog/project-ledger-skeleton';

export function ProjectResultsLedger({
    institutionName,
    isMine,
    resultSummary,
    hasError,
    isForbidden,
    isPending,
    projects,
    actions,
}: {
    institutionName: string;
    isMine: boolean;
    resultSummary: string;
    hasError: boolean;
    isForbidden: boolean;
    isPending: boolean;
    projects: ProjectPagination;
    actions: {
        retry: () => void;
        resetFilters: () => void;
        changeView: (view: 'opportunities' | 'mine') => void;
        visitDiscovery: (page: number, applied: boolean) => void;
    };
}) {
    return (
        <section
            aria-labelledby="project-results-title"
            aria-busy={isPending}
            data-test="projects-results"
            className="project-discovery-results min-w-0 space-y-4"
        >
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold tracking-wider text-primary uppercase">
                        {isMine ? 'Pekerjaan dan arsip saya' : 'Daftar peluang'}
                    </p>
                    <h2
                        id="project-results-title"
                        className="text-title font-bold tracking-tight text-foreground"
                    >
                        {isMine ? 'Proyek saya' : 'Peluang proyek'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {isMine ? 'Pekerjaan' : 'Peluang'} dalam konteks{' '}
                        {institutionName}.
                    </p>
                </div>
                <div
                    role="status"
                    aria-live="polite"
                    className="max-w-full rounded-full border border-border bg-accent px-3 py-1.5 text-sm font-medium wrap-anywhere text-primary"
                >
                    {resultSummary}
                </div>
            </div>

            {hasError && (
                <ProjectErrorState
                    onRetry={actions.retry}
                    forbidden={isForbidden}
                    processing={isPending}
                />
            )}

            {isPending && (
                <div
                    data-test="projects-refresh-skeleton"
                    className="min-w-0"
                    role="status"
                    aria-live="polite"
                >
                    <p className="sr-only">Memuat proyek terbaru.</p>
                    <ul
                        aria-hidden="true"
                        className="project-discovery-grid grid min-w-0 gap-4"
                    >
                        <ProjectLedgerSkeleton />
                    </ul>
                </div>
            )}

            {!hasError && projects.data.length === 0 && !isPending && (
                <ProjectEmptyState
                    onReset={actions.resetFilters}
                    isMine={isMine}
                    onExplore={() => actions.changeView('opportunities')}
                />
            )}

            {!hasError && projects.data.length > 0 && (
                <ul
                    data-test="project-ledger"
                    className="project-discovery-grid grid min-w-0 gap-4"
                >
                    {projects.data.map((project) => (
                        <ProjectLedgerRow key={project.id} project={project} />
                    ))}
                </ul>
            )}

            {!hasError && (
                <ProjectCatalogPagination
                    currentPage={projects.meta.current_page}
                    lastPage={projects.meta.last_page}
                    isPending={isPending}
                    onPageChange={(page) => actions.visitDiscovery(page, true)}
                />
            )}
        </section>
    );
}
