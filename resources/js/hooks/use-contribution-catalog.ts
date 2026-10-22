import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type {
    ContributionStatus,
    ContributionSummary,
} from '@/types/contribution';

export interface UseContributionCatalogProps {
    contributions: ContributionSummary[];
}

export interface UseContributionCatalogReturn {
    state: {
        query: string;
        status: ContributionStatus | 'all';
        isRefreshing: boolean;
        refreshError: string | null;
        isForbidden: boolean;
        visibleContributions: ContributionSummary[];
        totalCount: number;
    };
    actions: {
        setQuery: (query: string) => void;
        setStatus: (status: ContributionStatus | 'all') => void;
        refresh: () => void;
        resetFilters: () => void;
    };
}

export function useContributionCatalog({
    contributions,
}: UseContributionCatalogProps): UseContributionCatalogReturn {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<ContributionStatus | 'all'>('all');

    const visibleContributions = useMemo(() => {
        const search = query.trim().toLocaleLowerCase('id-ID');

        return contributions.filter(
            (item) =>
                (status === 'all' || item.status === status) &&
                (
                    item.project.title +
                    ' ' +
                    (item.current_version?.task?.title ?? '')
                )
                    .toLocaleLowerCase('id-ID')
                    .includes(search),
        );
    }, [contributions, query, status]);

    function refresh(): void {
        setRefreshError(null);
        setIsRefreshing(true);
        router.reload({
            only: ['contributions', 'can_create'],
            onSuccess: () => {
                setRefreshError(null);
                setIsForbidden(false);
            },
            onError: () =>
                setRefreshError(
                    'Daftar belum diperbarui. Catatan yang terlihat tetap tersimpan. Coba lagi.',
                ),
            onHttpException: (response) => {
                setIsForbidden(response.status === 403);
                setRefreshError(
                    response.status === 403
                        ? 'Akses daftar kontribusi tidak tersedia untuk akunmu saat ini. Periksa afiliasi kampus atau coba muat ulang.'
                        : 'Daftar belum diperbarui. Catatan yang terlihat tetap tersimpan. Coba muat ulang lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setRefreshError(
                    'Daftar belum diperbarui. Catatan yang terlihat tetap tersimpan. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
            onFinish: () => setIsRefreshing(false),
        });
    }

    function resetFilters(): void {
        setQuery('');
        setStatus('all');
    }

    return {
        state: {
            query,
            status,
            isRefreshing,
            refreshError,
            isForbidden,
            visibleContributions,
            totalCount: contributions.length,
        },
        actions: {
            setQuery,
            setStatus,
            refresh,
            resetFilters,
        },
    };
}
