import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { PortfolioEntry, PortfolioProfile } from '@/types/portfolio';

export interface UsePortfolioCollectionOptions {
    entries?: PortfolioEntry[];
    profile?: PortfolioProfile | null;
}

export interface UsePortfolioCollectionState {
    isRefreshing: boolean;
    refreshError: string | null;
    isForbidden: boolean;
    resolvedProfile: PortfolioProfile | null;
    resolvedEntries: PortfolioEntry[];
}

export interface UsePortfolioCollectionActions {
    refresh: () => void;
    handleEntryUpdated: (entry: PortfolioEntry) => void;
    handleProfileUpdated: (profile: PortfolioProfile) => void;
    handleAccessRevoked: () => void;
}

export function usePortfolioCollection({
    entries,
    profile,
}: UsePortfolioCollectionOptions): {
    state: UsePortfolioCollectionState;
    actions: UsePortfolioCollectionActions;
} {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [entryOverrides, setEntryOverrides] = useState<
        Record<number, PortfolioEntry>
    >({});
    const [profileOverride, setProfileOverride] =
        useState<PortfolioProfile | null>(null);

    const resolvedProfile =
        (profile &&
        profileOverride?.id === profile.id &&
        profileOverride.updated_at >= profile.updated_at
            ? profileOverride
            : profile) ?? null;

    const resolvedEntries = (entries ?? []).map((entry) =>
        entryOverrides[entry.id] &&
        entryOverrides[entry.id].updated_at >= entry.updated_at
            ? entryOverrides[entry.id]
            : entry,
    );

    function refresh(): void {
        if (isRefreshing) {
            return;
        }

        setRefreshError(null);
        setIsRefreshing(true);
        router.reload({
            only: ['entries', 'profile', 'permissions'],
            onSuccess: () => {
                setRefreshError(null);
                setIsForbidden(false);
                setEntryOverrides({});
                setProfileOverride(null);
            },
            onError: () =>
                setRefreshError(
                    'Koleksi belum diperbarui. Karya tersimpan tetap aman. Coba lagi.',
                ),
            onHttpException: (response) => {
                if ([401, 403, 404].includes(response.status)) {
                    setIsForbidden(true);
                }

                setRefreshError(
                    response.status === 403
                        ? 'Akses portofolio tidak tersedia saat ini. Periksa afiliasi kampus atau coba muat ulang.'
                        : 'Koleksi belum diperbarui. Karya tersimpan tetap aman. Coba lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setRefreshError(
                    'Koleksi belum diperbarui. Karya yang terlihat tetap tersimpan. Periksa koneksi dan coba lagi.',
                );

                return false;
            },
            onFinish: () => setIsRefreshing(false),
        });
    }

    function handleEntryUpdated(entry: PortfolioEntry): void {
        setEntryOverrides((current) => ({
            ...current,
            [entry.id]: entry,
        }));
    }

    function handleProfileUpdated(newProfile: PortfolioProfile): void {
        setProfileOverride(newProfile);
    }

    function handleAccessRevoked(): void {
        setIsForbidden(true);
    }

    return {
        state: {
            isRefreshing,
            refreshError,
            isForbidden,
            resolvedProfile,
            resolvedEntries,
        },
        actions: {
            refresh,
            handleEntryUpdated,
            handleProfileUpdated,
            handleAccessRevoked,
        },
    };
}
