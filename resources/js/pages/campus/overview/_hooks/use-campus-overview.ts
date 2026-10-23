import { router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
import type {
    CampusOverviewProps,
    OverviewQuery,
} from '@/pages/campus/overview/_types/overview-types';
import { show as campusOverview } from '@/routes/campus/overview';

export function useCampusOverview({
    institution,
    members,
    filters,
}: Pick<CampusOverviewProps, 'institution' | 'members' | 'filters'>) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [program, setProgram] = useState(filters.program || '');
    const [isPending, setIsPending] = useState(false);
    const [isForbidden, setIsForbidden] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [hasError, setHasError] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const errorRef = useRef<HTMLDivElement>(null);

    const appliedQuery: OverviewQuery = {
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        program: filters.program || undefined,
        page: members.pagination.current_page,
        per_page: members.pagination.per_page,
    };

    const lastRequestRef = useRef<{ query: OverviewQuery; syncDraft: boolean }>(
        { query: appliedQuery, syncDraft: false },
    );

    const hasAppliedFilters = Boolean(
        filters.date_from || filters.date_to || filters.program,
    );
    const hasDraftChanges =
        dateFrom !== (filters.date_from || '') ||
        dateTo !== (filters.date_to || '') ||
        program !== (filters.program || '');

    const failRequest = (forbidden = false): false => {
        if (forbidden) {
            setIsForbidden(true);
        }

        setHasError(true);
        setFeedback(
            'Ringkasan belum dapat diperbarui. Pilihan filter tetap tersedia. Coba lagi untuk mengambil hasil terbaru.',
        );
        requestAnimationFrame(() => errorRef.current?.focus());

        return false;
    };

    const visitOverview = (query: OverviewQuery, syncDraft = false) => {
        if (isPending) {
            return;
        }

        lastRequestRef.current = { query, syncDraft };
        setIsPending(true);
        setHasError(false);
        setFieldErrors({});
        setFeedback('Memuat ringkasan dan anggota kampus.');

        router.get(campusOverview({ institution: institution.id }), query, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsForbidden(false);
                setHasError(false);
                setFeedback('Ringkasan kampus telah diperbarui.');

                if (syncDraft) {
                    setDateFrom(query.date_from || '');
                    setDateTo(query.date_to || '');
                    setProgram(query.program || '');
                }
            },
            onError: (errors) => {
                setFieldErrors(errors);
                failRequest();
            },
            onHttpException: (response) =>
                failRequest(response.status === 403 || response.status === 404),
            onNetworkError: () => failRequest(),
            onFinish: () => setIsPending(false),
        });
    };

    const handleFilterSubmit = (event: FormEvent) => {
        event.preventDefault();
        visitOverview(
            {
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                program: program.trim() || undefined,
                page: 1,
                per_page: members.pagination.per_page,
            },
            true,
        );
    };

    const resetFilters = () => {
        visitOverview(
            {
                page: 1,
                per_page: members.pagination.per_page,
            },
            true,
        );
    };

    const retryLastRequest = () => {
        visitOverview(
            lastRequestRef.current.query,
            lastRequestRef.current.syncDraft,
        );
    };

    return {
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        program,
        setProgram,
        isPending,
        isForbidden,
        feedback,
        hasError,
        fieldErrors,
        errorRef,
        appliedQuery,
        hasAppliedFilters,
        hasDraftChanges,
        visitOverview,
        handleFilterSubmit,
        resetFilters,
        retryLastRequest,
    };
}
