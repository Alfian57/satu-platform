import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { PortfolioEntry, PortfolioProfile } from '@/types/portfolio';

export interface UsePortfolioDetailOptions {
    initialEntry: PortfolioEntry;
    profile?: PortfolioProfile | null;
}

export interface UsePortfolioDetailState {
    entry: PortfolioEntry;
    resolvedProfile: PortfolioProfile | null;
    isRefreshing: boolean;
    refreshError: string | null;
    isForbidden: boolean;
}

export interface UsePortfolioDetailActions {
    refresh: () => void;
    setEntryOverride: (entry: PortfolioEntry) => void;
    setProfileOverride: (profile: PortfolioProfile) => void;
    handleAccessRevoked: () => void;
}

export function usePortfolioDetail({
    initialEntry,
    profile,
}: UsePortfolioDetailOptions): {
    state: UsePortfolioDetailState;
    actions: UsePortfolioDetailActions;
} {
    const [entryOverride, setEntryOverride] = useState<PortfolioEntry | null>(
        null,
    );
    const [profileOverride, setProfileOverride] =
        useState<PortfolioProfile | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);

    const entry =
        entryOverride?.id === initialEntry.id &&
        entryOverride.updated_at >= initialEntry.updated_at
            ? entryOverride
            : initialEntry;

    const resolvedProfile =
        (profile &&
        profileOverride?.id === profile.id &&
        profileOverride.updated_at >= profile.updated_at
            ? profileOverride
            : profile) ?? null;

    function refresh(): void {
        if (isRefreshing) {
            return;
        }

        setRefreshError(null);
        setIsRefreshing(true);
        router.reload({
            only: ['entry', 'profile', 'permissions'],
            onSuccess: () => {
                setRefreshError(null);
                setIsForbidden(false);
                setEntryOverride(null);
                setProfileOverride(null);
            },
            onError: () =>
                setRefreshError(
                    'Detail belum diperbarui. Karya tersimpan tetap aman. Coba lagi.',
                ),
            onHttpException: (response) => {
                if ([401, 403, 404].includes(response.status)) {
                    setIsForbidden(true);
                }

                setRefreshError(
                    response.status === 403
                        ? 'Akses karya ini sudah tidak tersedia. Kembali ke Portofolio atau coba muat ulang.'
                        : 'Detail belum diperbarui. Karya tersimpan tetap aman. Coba lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setRefreshError(
                    'Detail belum diperbarui. Karya tersimpan tetap aman. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
            onFinish: () => setIsRefreshing(false),
        });
    }

    function handleAccessRevoked(): void {
        setIsForbidden(true);
    }

    return {
        state: {
            entry,
            resolvedProfile,
            isRefreshing,
            refreshError,
            isForbidden,
        },
        actions: {
            refresh,
            setEntryOverride,
            setProfileOverride,
            handleAccessRevoked,
        },
    };
}
