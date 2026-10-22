import { router, useHttp } from '@inertiajs/react';
import type { FormEvent, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import ContributionController from '@/actions/App/Http/Controllers/ContributionController';
import { firstError } from '@/components/campus/contributions/contribution-types';
import type {
    CampusContributionsProps,
    ContributionApiResponse,
    ContributionReviewQueueItem,
    ErrorMap,
    ReviewDecision,
    ReviewFilters,
    ReviewPayload,
    ReviewQueue,
} from '@/components/campus/contributions/contribution-types';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';

export interface UseContributionReviewProps {
    institution: CampusContributionsProps['institution'];
    filters: ReviewFilters;
    reviewQueue: ReviewQueue;
    isFilterLoading: boolean;
    onAccessUnavailable: () => void;
    filterChangeGuardRef: RefObject<(() => boolean) | null>;
}

export function useContributionReview({
    institution,
    filters,
    reviewQueue,
    isFilterLoading,
    onAccessUnavailable,
    filterChangeGuardRef,
}: UseContributionReviewProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isQueueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [accessUnavailable, setAccessUnavailable] = useState(false);
    const commandLock = useRef(false);
    const [needsCheck, setNeedsCheck] = useState(false);
    const [commandBlocked, setCommandBlocked] = useState(false);
    const validationFocus = useRef(false);
    const reviewForm = useHttp<ReviewPayload, ContributionApiResponse>({
        decision: 'approved',
        expected_version: 0,
        expected_revision: '',
        reason: null,
        note: null,
    });

    const selected =
        reviewQueue.items.find((item) => item.id === selectedId) ?? null;
    const version = selected?.current_version ?? null;
    const formErrors = reviewForm.errors as ErrorMap;
    const statusError = firstError(formErrors, 'status');
    const decisionError = firstError(formErrors, 'decision');
    const reasonError = firstError(formErrors, 'reason');
    const noteError = firstError(formErrors, 'note');
    const selectedDecision = reviewForm.data.decision;
    const isLoading = isQueueLoading || isFilterLoading;

    useEffect(() => {
        const guard = (): boolean => {
            if (
                commandLock.current ||
                isLoading ||
                needsCheck ||
                accessUnavailable
            ) {
                return false;
            }

            return (
                !(reviewForm.data.reason || reviewForm.data.note) ||
                window.confirm(
                    'Ganti antrean dan buang catatan keputusan belum disimpan?',
                )
            );
        };
        filterChangeGuardRef.current = guard;

        return () => {
            if (filterChangeGuardRef.current === guard) {
                filterChangeGuardRef.current = null;
            }
        };
    }, [
        filterChangeGuardRef,
        isLoading,
        needsCheck,
        accessUnavailable,
        reviewForm.data.reason,
        reviewForm.data.note,
    ]);

    const stale =
        selected !== null &&
        selected.revision !== reviewForm.data.expected_revision;
    const blocked =
        reviewForm.processing ||
        commandBlocked ||
        needsCheck ||
        stale ||
        isLoading ||
        queueError !== null;

    useEffect(() => {
        if (validationFocus.current && !reviewForm.processing) {
            validationFocus.current = false;
            document
                .querySelector<HTMLElement>(
                    '[data-test="campus-contribution-review-form"] [aria-invalid="true"]',
                )
                ?.focus();
        }
    }, [reviewForm.errors, reviewForm.processing]);

    useEffect(() => {
        function handleEscape(event: KeyboardEvent): void {
            if (
                event.key === 'Escape' &&
                selectedId !== null &&
                !reviewForm.processing
            ) {
                if (
                    (reviewForm.data.reason || reviewForm.data.note) &&
                    !window.confirm(
                        'Tutup berkas dan buang catatan keputusan yang belum disimpan?',
                    )
                ) {
                    return;
                }

                setSelectedId(null);
                window.setTimeout(
                    () =>
                        document
                            .querySelector<HTMLButtonElement>(
                                `[data-test="campus-contribution-select-${selectedId}"]`,
                            )
                            ?.focus(),
                    0,
                );
            }
        }

        document.addEventListener('keydown', handleEscape);

        return () => document.removeEventListener('keydown', handleEscape);
    }, [
        selectedId,
        reviewForm.processing,
        reviewForm.data.reason,
        reviewForm.data.note,
    ]);

    function selectItem(item: ContributionReviewQueueItem): void {
        if (commandLock.current || isLoading || needsCheck) {
            return;
        }

        if (
            (selectedId !== item.id || stale) &&
            (reviewForm.data.reason || reviewForm.data.note) &&
            !window.confirm(
                'Pindah berkas dan buang catatan keputusan yang belum disimpan?',
            )
        ) {
            return;
        }

        setSelectedId(item.id);
        reviewForm.clearErrors();
        setCommandBlocked(false);
        setActionMessage(null);
        setActionError(null);
        reviewForm.setData({
            decision: 'approved',
            expected_version: item.current_version?.version_number ?? 0,
            expected_revision: item.revision,
            reason: null,
            note: null,
        });
        window.setTimeout(() => {
            document.getElementById('campus-review-decision-title')?.focus();
        }, 0);
    }

    function updatePage(page: number): void {
        if (commandLock.current || isLoading || needsCheck) {
            return;
        }

        if (
            (reviewForm.data.reason || reviewForm.data.note) &&
            !window.confirm(
                'Ganti antrean dan buang catatan keputusan belum disimpan?',
            )
        ) {
            return;
        }

        setQueueLoading(true);
        setQueueError(null);
        setSelectedId(null);
        router.get(
            campusContributionsIndex({ institution: institution.id }),
            {
                status: filters.status,
                q: filters.q?.trim() || undefined,
                sort: filters.sort,
                page,
            },
            {
                only: ['filters', 'reviewQueue'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    setQueueError(null);
                    setAccessUnavailable(false);
                },
                onError: () => {
                    setQueueError(
                        'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                    );
                },
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        setAccessUnavailable(true);
                        onAccessUnavailable();
                    }

                    setQueueError(
                        'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setQueueError(
                        'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Periksa koneksi lalu coba lagi.',
                    );

                    return false;
                },
                onFinish: () => setQueueLoading(false),
            },
        );
    }

    function refreshQueue(): void {
        if (commandLock.current || isLoading) {
            return;
        }

        setQueueLoading(true);
        setQueueError(null);
        router.reload({
            only: ['reviewQueue'],
            onSuccess: () => {
                setQueueError(null);
                setNeedsCheck(false);
            },
            onError: () => {
                setQueueError(
                    'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                );
            },
            onHttpException: (response) => {
                if (response.status === 403 || response.status === 404) {
                    setAccessUnavailable(true);
                    onAccessUnavailable();
                }

                setQueueError(
                    'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setQueueError(
                    'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
            onFinish: () => setQueueLoading(false),
        });
    }

    function submitReview(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (
            selected === null ||
            version === null ||
            selected.status !== 'pending' ||
            blocked ||
            commandLock.current
        ) {
            return;
        }

        commandLock.current = true;
        setActionMessage(null);
        setActionError(null);
        reviewForm.transform((data) => ({
            ...data,
            reason: data.reason?.trim() || null,
            note: data.note?.trim() || null,
        }));
        reviewForm
            .post(ContributionController.review(selected.id).url, {
                onSuccess: () => {
                    setSelectedId(null);
                    setCommandBlocked(false);
                    reviewForm.setData({
                        decision: 'approved',
                        expected_version: 0,
                        expected_revision: '',
                        reason: null,
                        note: null,
                    });
                    setActionMessage(
                        'Keputusan tersimpan. Persetujuan menghasilkan karya privat, bukan publikasi bukti.',
                    );
                    setActionError(null);
                    setNeedsCheck(true);
                    setQueueLoading(true);
                    router.reload({
                        only: ['reviewQueue'],
                        onSuccess: () => {
                            setQueueError(null);
                            setNeedsCheck(false);
                        },
                        onHttpException: (response) => {
                            if (
                                response.status === 403 ||
                                response.status === 404
                            ) {
                                setAccessUnavailable(true);
                                onAccessUnavailable();
                            }

                            setQueueError(
                                'Keputusan tersimpan, tetapi antrean terbaru belum terbaca. Periksa antrean sebelum keputusan lain.',
                            );

                            return false;
                        },
                        onNetworkError: () => {
                            setQueueError(
                                'Keputusan tersimpan, tetapi antrean terbaru belum terbaca. Periksa koneksi.',
                            );

                            return false;
                        },
                        onFinish: () => setQueueLoading(false),
                    });
                },
                onError: (errors) => {
                    validationFocus.current = true;

                    if (
                        'status' in errors ||
                        'evidence' in errors ||
                        'expected_revision' in errors ||
                        'expected_version' in errors
                    ) {
                        setCommandBlocked(true);
                        setActionError(
                            'Berkas atau bukti perlu diperiksa. Perbaikan dan penolakan tetap memerlukan sumber terbaru.',
                        );
                    }
                },
                onHttpException: (response: { status: number }) => {
                    setNeedsCheck(true);
                    setCommandBlocked(true);

                    if (response.status === 403 || response.status === 404) {
                        setAccessUnavailable(true);
                        onAccessUnavailable();
                    }

                    setActionError(
                        response.status === 403
                            ? 'Akses review sudah tidak tersedia. Data yang terlihat tetap aman.'
                            : response.status === 422
                              ? 'Keputusan belum disimpan. Berkas mungkin berubah, atau field perlu diperbaiki.'
                              : response.status === 409
                                ? 'Berkas berubah. Periksa antrean dan gunakan berkas terbaru sebelum memutuskan.'
                                : 'Hasil keputusan belum dapat dipastikan. Periksa antrean sebelum mengirim lagi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setNeedsCheck(true);
                    setCommandBlocked(true);
                    setActionError(
                        'Hasil keputusan belum pasti. Catatan tetap ada. Periksa antrean, jangan langsung mengirim ulang.',
                    );

                    return false;
                },
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    function useLatest(): void {
        if (
            window.confirm(
                'Gunakan berkas terbaru dan kosongkan catatan keputusan yang belum disimpan?',
            )
        ) {
            reviewForm.clearErrors();
            reviewForm.setData({
                decision: 'approved',
                expected_version:
                    selected?.current_version?.version_number ?? 0,
                expected_revision: selected?.revision ?? '',
                reason: null,
                note: null,
            });
            setCommandBlocked(false);
            setActionError(null);
        }
    }

    function closeDocket(): void {
        if (
            (reviewForm.data.reason || reviewForm.data.note) &&
            !window.confirm(
                'Tutup berkas dan buang catatan keputusan yang belum disimpan?',
            )
        ) {
            return;
        }

        const prevId = selectedId;
        setSelectedId(null);
        window.setTimeout(() => {
            document
                .querySelector<HTMLButtonElement>(
                    `[data-test="campus-contribution-select-${prevId}"]`,
                )
                ?.focus();
        }, 0);
    }

    function handleDecisionChange(decision: ReviewDecision): void {
        reviewForm.setData('decision', decision);
    }

    function handleReasonChange(reason: string): void {
        reviewForm.setData('reason', reason);
    }

    function handleNoteChange(note: string): void {
        reviewForm.setData('note', note);
    }

    return {
        selectedId,
        selected,
        version,
        isLoading,
        isProcessing: reviewForm.processing,
        actionMessage,
        actionError,
        queueError,
        accessUnavailable,
        stale,
        blocked,
        needsCheck,
        commandBlocked,
        selectedDecision,
        reason: reviewForm.data.reason,
        note: reviewForm.data.note,
        statusError,
        decisionError,
        reasonError,
        noteError,
        selectItem,
        updatePage,
        refreshQueue,
        submitReview,
        useLatest,
        closeDocket,
        handleDecisionChange,
        handleReasonChange,
        handleNoteChange,
    };
}
