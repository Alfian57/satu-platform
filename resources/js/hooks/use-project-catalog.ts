import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type {
    DiscoveryFilters,
    ProjectPagination,
} from '@/components/projects/catalog/catalog-utils';
import { index as projectsIndex } from '@/routes/projects';
import type { QueryParams } from '@/wayfinder';

export type UseProjectCatalogOptions = {
    filters: DiscoveryFilters;
    projects: ProjectPagination;
};

export function useProjectCatalog({
    filters,
    projects,
}: UseProjectCatalogOptions) {
    const isMine = filters.view === 'mine';
    const lastQuery = useRef<QueryParams>({
        view: filters.view,
        institution_id: filters.institution_id,
    });
    const [searchQuery, setSearchQuery] = useState(filters.q);
    const [selectedStatuses, setSelectedStatuses] = useState(filters.status);
    const [selectedVisibilities, setSelectedVisibilities] = useState(
        filters.visibility,
    );
    const [selectedSort, setSelectedSort] = useState(filters.sort);
    const [selectedDirection, setSelectedDirection] = useState(
        filters.direction,
    );
    const [selectedPerPage, setSelectedPerPage] = useState(filters.per_page);
    const [selectedBeginner, setSelectedBeginner] = useState<
        'all' | 'accepting'
    >(filters.beginner ?? 'all');
    const [selectedAvailability, setSelectedAvailability] = useState<
        'all' | 'available'
    >(filters.availability ?? 'all');
    const [isPending, setIsPending] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isForbidden, setIsForbidden] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setSearchQuery(filters.q);
            setSelectedStatuses(filters.status);
            setSelectedVisibilities(filters.visibility);
            setSelectedSort(filters.sort);
            setSelectedDirection(filters.direction);
            setSelectedPerPage(filters.per_page);
            setSelectedBeginner(filters.beginner ?? 'all');
            setSelectedAvailability(filters.availability ?? 'all');
        });

        return () => cancelAnimationFrame(frame);
    }, [
        filters.direction,
        filters.beginner,
        filters.availability,
        filters.institution_id,
        filters.per_page,
        filters.q,
        filters.sort,
        filters.status,
        filters.view,
        filters.visibility,
    ]);

    const queryForPage = (page: number, applied = false): QueryParams => ({
        view: filters.view,
        q: (applied ? filters.q : searchQuery).trim() || undefined,
        beginner: applied ? filters.beginner : selectedBeginner,
        availability: applied ? filters.availability : selectedAvailability,
        status: (applied ? filters.status : selectedStatuses).join(','),
        visibility: (applied ? filters.visibility : selectedVisibilities).join(
            ',',
        ),
        sort: applied ? filters.sort : selectedSort,
        direction: applied ? filters.direction : selectedDirection,
        institution_id: filters.institution_id,
        per_page: applied ? filters.per_page : selectedPerPage,
        page: page > 1 ? page : undefined,
    });

    const handleDiscoveryFailure = (forbidden = false): false => {
        setHasError(true);
        setIsForbidden((current) => current || forbidden);
        setIsPending(false);

        return false;
    };

    const visitQuery = (query: QueryParams, preserveScroll = false): void => {
        lastQuery.current = query;
        setIsPending(true);

        router.visit(projectsIndex({ query }), {
            preserveScroll,
            preserveState: true,
            replace: true,
            onSuccess: () => {
                setHasError(false);
                setIsForbidden(false);
            },
            onError: () => setHasError(true),
            onHttpException: (response) =>
                handleDiscoveryFailure(response.status === 403),
            onNetworkError: () => handleDiscoveryFailure(),
            onFinish: () => setIsPending(false),
        });
    };

    const visitDiscovery = (page = 1, applied = false): void => {
        visitQuery(queryForPage(page, applied), page > 1);
    };

    const changeView = (view: DiscoveryFilters['view']): void => {
        if (view !== filters.view) {
            visitQuery({ view, institution_id: filters.institution_id });
        }
    };

    const resetFilters = (): void => {
        visitQuery({
            view: filters.view,
            institution_id: filters.institution_id,
        });
    };

    const toggleStatus = (status: string, checked: boolean): void => {
        if (!checked && selectedStatuses.length === 1) {
            return;
        }

        setSelectedStatuses((current) =>
            checked
                ? Array.from(new Set([...current, status]))
                : current.filter((value) => value !== status),
        );
    };

    const toggleVisibility = (visibility: string, checked: boolean): void => {
        if (!checked && selectedVisibilities.length === 1) {
            return;
        }

        setSelectedVisibilities((current) =>
            checked
                ? Array.from(new Set([...current, visibility]))
                : current.filter((value) => value !== visibility),
        );
    };

    const retry = (): void => {
        visitQuery(lastQuery.current);
    };

    const resultSummary = isPending
        ? 'Memuat ulang daftar proyek.'
        : hasError
          ? 'Hasil belum dapat ditampilkan. Coba lagi untuk memeriksa akses dan data terbaru.'
          : projects.meta.total === 0
            ? 'Tidak ada proyek yang cocok dengan filter saat ini.'
            : `${projects.meta.from} sampai ${projects.meta.to} dari ${projects.meta.total} proyek.`;

    return {
        isMine,
        searchQuery,
        selectedStatuses,
        selectedVisibilities,
        selectedSort,
        selectedDirection,
        selectedPerPage,
        selectedBeginner,
        selectedAvailability,
        isPending,
        hasError,
        isForbidden,
        resultSummary,
        actions: {
            setSearchQuery,
            setSelectedBeginner,
            setSelectedAvailability,
            setSelectedSort,
            setSelectedDirection,
            setSelectedPerPage,
            toggleStatus,
            toggleVisibility,
            visitQuery,
            visitDiscovery,
            changeView,
            resetFilters,
            retry,
        },
    };
}
