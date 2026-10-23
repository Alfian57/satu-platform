import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type {
    CampusAffiliationsProps,
    Filters,
} from '@/pages/campus/affiliations/_types/affiliation-types';
import { index as affiliationIndex } from '@/routes/campus/affiliations';

export function useCampusAffiliations({
    institution,
    filters,
}: Pick<CampusAffiliationsProps, 'institution' | 'filters'>) {
    const [isQueueLoading, setQueueLoading] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [isForbidden, setForbidden] = useState(false);
    const errorRef = useRef<HTMLDivElement>(null);

    function reportError(forbidden: boolean) {
        if (forbidden) {
            setForbidden(true);
        }

        setRequestError(
            forbidden
                ? 'Akses antrean tidak tersedia. Periksa kembali hak akses kampus dengan memuat ulang.'
                : 'Hasil permintaan belum dapat dikonfirmasi. Isian tetap tersedia. Periksa pesan isian atau muat ulang antrean sebelum mencoba kembali.',
        );
        requestAnimationFrame(() => errorRef.current?.focus());
    }

    function confirmAccess() {
        setForbidden(false);
        setRequestError(null);
    }

    function visitQueue(next: Filters) {
        if (isQueueLoading) {
            return;
        }

        setRequestError(null);
        setQueueLoading(true);

        router.get(
            affiliationIndex({ institution: institution.id }),
            {
                match: next.match ?? undefined,
                stale: next.stale === null ? undefined : next.stale ? 1 : 0,
                sort: next.sort,
            },
            {
                only: ['filters', 'reviewQueue'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: confirmAccess,
                onError: () => reportError(false),
                onNetworkError: () => {
                    reportError(false);

                    return false;
                },
                onHttpException: (response) => {
                    reportError(
                        response.status === 403 || response.status === 404,
                    );

                    return false;
                },
                onFinish: () => setQueueLoading(false),
            },
        );
    }

    function changeFilter(key: keyof Filters, value: string) {
        visitQueue({
            ...filters,
            [key]:
                key === 'stale'
                    ? value === 'all'
                        ? null
                        : value === 'true'
                    : value === 'all'
                      ? null
                      : value,
        } as Filters);
    }

    return {
        isQueueLoading,
        setQueueLoading,
        requestError,
        isForbidden,
        errorRef,
        reportError,
        confirmAccess,
        visitQueue,
        changeFilter,
    };
}
