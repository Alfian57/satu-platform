import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { index as leaderboardsIndex } from '@/routes/leaderboards';
import { individual as individualPreference } from '@/routes/leaderboards/preferences';
import type {
    LeaderboardPageData,
    LeaderboardRow,
    LeaderboardRowsRegion,
    LeaderboardScope,
} from '@/types/leaderboard';

export type Selection = {
    semester: string;
    scope: LeaderboardScope;
    page: number;
};

export interface UseLeaderboardsProps {
    leaderboard: LeaderboardPageData;
    leaderboardRows?: LeaderboardRowsRegion;
}

export interface UseLeaderboardsReturn {
    state: {
        isNavigating: boolean;
        loadError: string | null;
        isForbidden: boolean;
        pendingPreference: boolean;
        needsPreferenceCheck: boolean;
        preferenceIntent: boolean | null;
        preferenceError: string | null;
        preferenceFeedback: string | null;
        explanationRow: LeaderboardRow | null;
        failedSelection: Selection | null;
        forbidden: boolean;
        busy: boolean;
    };
    actions: {
        requestRows: (selection?: Selection | null) => void;
        openPreference: () => void;
        closePreference: () => void;
        submitPreference: (isOptedIn: boolean) => void;
        openExplanation: (row: LeaderboardRow) => void;
        closeExplanation: () => void;
        clearPreferenceFeedback: () => void;
        clearPreferenceError: () => void;
    };
    refs: {
        preferenceErrorRef: React.RefObject<HTMLDivElement | null>;
        preferenceReturnFocus: React.RefObject<HTMLElement | null>;
        explanationReturnFocus: React.RefObject<HTMLElement | null>;
    };
}

export function useLeaderboards({
    leaderboard,
    leaderboardRows,
}: UseLeaderboardsProps): UseLeaderboardsReturn {
    const [isNavigating, setIsNavigating] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [pendingPreference, setPendingPreference] = useState(false);
    const [needsPreferenceCheck, setNeedsPreferenceCheck] = useState(false);
    const [preferenceIntent, setPreferenceIntent] = useState<boolean | null>(
        null,
    );
    const [preferenceError, setPreferenceError] = useState<string | null>(null);
    const [preferenceFeedback, setPreferenceFeedback] = useState<string | null>(
        null,
    );
    const [explanationRow, setExplanationRow] = useState<LeaderboardRow | null>(
        null,
    );
    const [failedSelection, setFailedSelection] = useState<Selection | null>(
        null,
    );
    const preferenceErrorRef = useRef<HTMLDivElement | null>(null);
    const preferenceReturnFocus = useRef<HTMLElement | null>(null);
    const explanationReturnFocus = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (preferenceError && preferenceIntent !== null) {
            preferenceErrorRef.current?.focus();
        }
    }, [preferenceError, preferenceIntent]);

    useEffect(() => {
        let activeRowsVisit: string | null = null;
        const removeStart = router.on('start', (event) => {
            const visit = event.detail.visit;
            const isRowsVisit =
                visit.method === 'get' &&
                visit.url.pathname ===
                    new URL(leaderboardsIndex.url(), window.location.origin)
                        .pathname &&
                visit.only.includes('leaderboardRows');
            activeRowsVisit = isRowsVisit ? visit.id : null;
        });
        const removeFinish = router.on('finish', (event) => {
            if (event.detail.visit.id === activeRowsVisit) {
                activeRowsVisit = null;
            }
        });
        const removeHttp = router.on('httpException', (event) => {
            if (activeRowsVisit === null) {
                return;
            }

            if ([401, 403].includes(event.detail.response.status)) {
                setIsForbidden(true);
                setExplanationRow(null);
                setPreferenceIntent(null);
            }

            setLoadError(
                [401, 403].includes(event.detail.response.status)
                    ? 'Akses peringkat tidak tersedia. Periksa afiliasi atau masuk kembali, lalu coba muat ulang.'
                    : 'Hasil belum dapat dimuat. Data tersimpan tidak berubah. Coba muat ulang.',
            );
            event.preventDefault();
        });
        const removeNetwork = router.on('networkError', (event) => {
            if (activeRowsVisit === null) {
                return;
            }

            setLoadError(
                'Hasil belum dapat dimuat. Data tersimpan tidak berubah. Periksa koneksi dan coba lagi.',
            );
            event.preventDefault();
        });

        return () => {
            removeStart();
            removeFinish();
            removeHttp();
            removeNetwork();
        };
    }, []);

    function requestRows(selection: Selection | null = null): void {
        if (isNavigating || pendingPreference) {
            return;
        }

        setFailedSelection(selection);
        setLoadError(null);
        setIsNavigating(true);
        setExplanationRow(null);
        setPreferenceIntent(null);
        setPreferenceFeedback(null);
        const options = {
            only: ['leaderboard', 'leaderboardRows'],
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setIsForbidden(false);
                setLoadError(null);
                setFailedSelection(null);
                setPreferenceError(null);
                setNeedsPreferenceCheck(false);
            },
            onError: () =>
                setLoadError(
                    'Pilihan belum dapat diterapkan. Hasil sebelumnya tetap tersimpan. Coba lagi.',
                ),
            onHttpException: (response: { status: number }) => {
                if ([401, 403].includes(response.status)) {
                    setIsForbidden(true);
                }

                setLoadError(
                    [401, 403].includes(response.status)
                        ? 'Akses peringkat tidak tersedia. Periksa afiliasi atau masuk kembali, lalu coba muat ulang.'
                        : 'Hasil belum dapat diperbarui. Data tersimpan tidak berubah. Coba lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setLoadError(
                    'Hasil belum dapat diperbarui. Data tersimpan tidak berubah. Periksa koneksi dan coba lagi.',
                );

                return false;
            },
            onFinish: () => setIsNavigating(false),
        };

        if (selection) {
            router.get(leaderboardsIndex(), selection, {
                ...options,
                replace: true,
            });
        } else {
            router.reload(options);
        }
    }

    function openPreference(): void {
        if (needsPreferenceCheck || pendingPreference) {
            return;
        }

        preferenceReturnFocus.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
        setPreferenceError(null);
        setPreferenceFeedback(null);
        setPreferenceIntent(!leaderboard.preference.isOptedIn);
    }

    function closePreference(): void {
        setPreferenceIntent(null);
    }

    function submitPreference(isOptedIn: boolean): void {
        if (pendingPreference || needsPreferenceCheck) {
            return;
        }

        setPendingPreference(true);
        setPreferenceError(null);
        setExplanationRow(null);
        router.post(
            individualPreference(),
            {
                is_opted_in: isOptedIn,
                expected_version: leaderboard.preference.version,
                semester: leaderboard.semester || undefined,
                scope: leaderboard.scope,
            },
            {
                only: ['leaderboard', 'leaderboardRows'],
                preserveScroll: true,
                onSuccess: () => {
                    setPreferenceIntent(null);
                    setLoadError(null);
                    setPreferenceFeedback(
                        isOptedIn
                            ? 'Persetujuan tersimpan. Peringkat individual akan mengikuti hasil perhitungan server.'
                            : 'Persetujuan ditarik. Baris individual tidak ditampilkan pada pembacaan berikutnya. XP dan badge tetap tersimpan.',
                    );
                },
                onError: (errors) => {
                    if (errors.expected_version) {
                        setNeedsPreferenceCheck(true);
                    }

                    setPreferenceError(
                        Object.values(errors).join(' ') ||
                            'Persetujuan belum tersimpan. Periksa pilihan dan coba lagi.',
                    );
                },
                onHttpException: (response) => {
                    if ([401, 403].includes(response.status)) {
                        setIsForbidden(true);
                        setPreferenceIntent(null);
                        setLoadError(
                            'Akses peringkat tidak tersedia. Persetujuan belum dapat dikonfirmasi. Periksa afiliasi lalu muat ulang.',
                        );
                    } else {
                        setNeedsPreferenceCheck(true);
                        setPreferenceError(
                            'Persetujuan belum dapat dikonfirmasi. Periksa status dengan memuat ulang sebelum mencoba kembali.',
                        );
                    }

                    return false;
                },
                onNetworkError: () => {
                    setNeedsPreferenceCheck(true);
                    setPreferenceError(
                        'Koneksi terputus. Persetujuan belum dapat dikonfirmasi. Periksa koneksi dan muat ulang untuk memastikan statusnya.',
                    );

                    return false;
                },
                onFinish: () => setPendingPreference(false),
            },
        );
    }

    function openExplanation(row: LeaderboardRow): void {
        explanationReturnFocus.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
        setExplanationRow(row);
    }

    function closeExplanation(): void {
        setExplanationRow(null);
    }

    function clearPreferenceFeedback(): void {
        setPreferenceFeedback(null);
    }

    function clearPreferenceError(): void {
        setPreferenceError(null);
    }

    const forbidden =
        isForbidden ||
        leaderboard.state === 'forbidden' ||
        leaderboardRows?.state === 'forbidden';
    const busy = isNavigating || pendingPreference;

    return {
        state: {
            isNavigating,
            loadError,
            isForbidden,
            pendingPreference,
            needsPreferenceCheck,
            preferenceIntent,
            preferenceError,
            preferenceFeedback,
            explanationRow,
            failedSelection,
            forbidden,
            busy,
        },
        actions: {
            requestRows,
            openPreference,
            closePreference,
            submitPreference,
            openExplanation,
            closeExplanation,
            clearPreferenceFeedback,
            clearPreferenceError,
        },
        refs: {
            preferenceErrorRef,
            preferenceReturnFocus,
            explanationReturnFocus,
        },
    };
}
