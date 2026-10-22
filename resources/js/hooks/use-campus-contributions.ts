import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type {
    CampusContributionsProps,
    ReviewFilters,
} from '@/components/campus/contributions/contribution-types';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';

export function useCampusContributions({
    institution,
    filters,
}: Pick<CampusContributionsProps, 'institution' | 'filters'>) {
    const [isFilterLoading, setFilterLoading] = useState(false);
    const [filterError, setFilterError] = useState<string | null>(null);
    const [accessUnavailable, setAccessUnavailable] = useState(false);
    const [searchDraft, setSearchDraft] = useState(filters.q ?? '');
    const filterChangeGuardRef = useRef<(() => boolean) | null>(null);
    const lastFilterQuery = useRef<ReviewFilters>(filters);

    useEffect(() => {
        const frame = requestAnimationFrame(() =>
            setSearchDraft(filters.q ?? ''),
        );

        return () => cancelAnimationFrame(frame);
    }, [filters.q]);

    function updateFilters(next: Partial<ReviewFilters>): void {
        if (isFilterLoading || filterChangeGuardRef.current?.() === false) {
            return;
        }

        const merged = { ...filters, ...next };
        lastFilterQuery.current = merged;

        setFilterLoading(true);
        setFilterError(null);
        router.get(
            campusContributionsIndex({ institution: institution.id }),
            {
                status: merged.status,
                q: merged.q?.trim() || undefined,
                sort: merged.sort,
            },
            {
                only: ['filters', 'reviewQueue'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    setFilterError(null);
                    setAccessUnavailable(false);
                },
                onError: () => {
                    setFilterError(
                        'Filter belum diterapkan. Data antrean yang terlihat tetap aman. Coba lagi.',
                    );
                },
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        setAccessUnavailable(true);
                    }

                    setFilterError(
                        'Filter belum diterapkan. Data antrean yang terlihat tetap aman. Coba lagi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setFilterError(
                        'Filter belum diterapkan. Data antrean yang terlihat tetap aman. Periksa koneksi lalu coba lagi.',
                    );

                    return false;
                },
                onFinish: () => setFilterLoading(false),
            },
        );
    }

    function retryFilter(): void {
        updateFilters(lastFilterQuery.current);
    }

    return {
        isFilterLoading,
        filterError,
        accessUnavailable,
        setAccessUnavailable,
        searchDraft,
        setSearchDraft,
        filterChangeGuardRef,
        updateFilters,
        retryFilter,
    };
}
