import { router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { reasonsByDecision } from '@/pages/campus/affiliations/_types/affiliation-types';
import type {
    CampusAffiliationsProps,
    Decision,
    Filters,
    ReasonCode,
    ReviewItem,
    ReviewQueue,
} from '@/pages/campus/affiliations/_types/affiliation-types';
import { index as affiliationIndex } from '@/routes/campus/affiliations';
import { store as storeDecision } from '@/routes/campus/affiliations/decisions';
import {
    destroy as releaseLock,
    store as acquireLock,
} from '@/routes/campus/affiliations/locks';

export interface UseAffiliationReviewProps {
    institution: CampusAffiliationsProps['institution'];
    filters: Filters;
    reviewQueue: ReviewQueue;
    isQueueLoading: boolean;
    onQueueLoadingChange: (isLoading: boolean) => void;
    onRequestError: (forbidden: boolean) => void;
    onRequestSuccess: () => void;
    isForbidden: boolean;
}

export function useAffiliationReview({
    institution,
    filters,
    reviewQueue,
    isQueueLoading,
    onQueueLoadingChange,
    onRequestError,
    onRequestSuccess,
    isForbidden,
}: UseAffiliationReviewProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [decision, setDecision] = useState<Decision>('approve');
    const [reasonCode, setReasonCode] =
        useState<ReasonCode>('records_confirmed');
    const [note, setNote] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const decisionHeadingRef = useRef<HTMLHeadingElement>(null);
    const queueHeadingRef = useRef<HTMLHeadingElement>(null);

    const selected = useMemo(() => {
        if (isForbidden) {
            return null;
        }

        return (
            reviewQueue.items.find(
                (item) =>
                    item.id === selectedId &&
                    item.lock?.ownedByCurrentUser === true,
            ) ?? null
        );
    }, [isForbidden, reviewQueue.items, selectedId]);

    const selectedReference = selected?.id;
    useEffect(() => {
        if (selectedReference !== undefined) {
            decisionHeadingRef.current?.focus();
        }
    }, [selectedReference]);

    const requestFeedback = {
        onSuccess: onRequestSuccess,
        onError: (errors: Record<string, string>) => {
            setFieldErrors(errors);
            onRequestError(false);
        },
        onNetworkError: () => {
            onRequestError(false);

            return false;
        },
        onHttpException: (response: { status: number }) => {
            onRequestError(response.status === 403 || response.status === 404);

            return false;
        },
    };

    function updateFilters(next: Partial<Filters> & { page?: number }) {
        const merged = { ...filters, ...next };

        onQueueLoadingChange(true);
        router.get(
            affiliationIndex({ institution: institution.id }),
            {
                match: merged.match ?? undefined,
                stale: merged.stale === null ? undefined : merged.stale ? 1 : 0,
                sort: merged.sort,
                page: next.page ?? 1,
            },
            {
                only: ['filters', 'reviewQueue'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                ...requestFeedback,
                onFinish: () => onQueueLoadingChange(false),
            },
        );
    }

    function refreshQueue() {
        onQueueLoadingChange(true);
        router.reload({
            only: ['reviewQueue'],
            ...requestFeedback,
            onFinish: () => onQueueLoadingChange(false),
        });
    }

    function changeDecision(nextDecision: Decision) {
        setDecision(nextDecision);
        setReasonCode(reasonsByDecision[nextDecision][0].value);
    }

    function beginReview(item: ReviewItem) {
        if (
            isQueueLoading ||
            isForbidden ||
            processingId !== null ||
            item.isStale ||
            (item.lock && !item.lock.ownedByCurrentUser)
        ) {
            return;
        }

        if (item.lock?.ownedByCurrentUser) {
            if (selectedId !== item.id) {
                setNote('');
                changeDecision('approve');
                setFieldErrors({});
            }

            setSelectedId(item.id);

            return;
        }

        setFieldErrors({});
        setProcessingId(item.id);
        onQueueLoadingChange(true);
        router.post(
            acquireLock({
                institution: institution.id,
                affiliationRequest: item.id,
            }),
            {},
            {
                only: ['reviewQueue', 'reviewOutcome', 'reviewIssue'],
                preserveScroll: true,
                ...requestFeedback,
                onSuccess: (page) => {
                    onRequestSuccess();

                    if (page.props.reviewOutcome === 'lock_acquired') {
                        if (selectedId !== item.id) {
                            setNote('');
                            changeDecision('approve');
                        }

                        setSelectedId(item.id);
                    }
                },
                onFinish: () => {
                    setProcessingId(null);
                    onQueueLoadingChange(false);
                },
            },
        );
    }

    function abandonReview() {
        if (selected === null || isQueueLoading || processingId !== null) {
            return;
        }

        setFieldErrors({});
        setProcessingId(selected.id);
        onQueueLoadingChange(true);
        router.delete(
            releaseLock({
                institution: institution.id,
                affiliationRequest: selected.id,
            }),
            {
                only: ['reviewQueue', 'reviewOutcome', 'reviewIssue'],
                preserveScroll: true,
                ...requestFeedback,
                onSuccess: (page) => {
                    onRequestSuccess();

                    if (page.props.reviewOutcome === 'lock_released') {
                        setSelectedId(null);
                        requestAnimationFrame(() =>
                            queueHeadingRef.current?.focus(),
                        );
                    }
                },
                onFinish: () => {
                    setProcessingId(null);
                    onQueueLoadingChange(false);
                },
            },
        );
    }

    function submitDecision(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (
            selected === null ||
            !selected.lock?.ownedByCurrentUser ||
            isQueueLoading ||
            processingId !== null
        ) {
            return;
        }

        setFieldErrors({});
        setProcessingId(selected.id);
        onQueueLoadingChange(true);
        router.post(
            storeDecision({
                institution: institution.id,
                affiliationRequest: selected.id,
            }),
            {
                decision,
                reason_code: reasonCode,
                expected_version: selected.version,
                note: note.trim() === '' ? null : note,
            },
            {
                only: ['reviewQueue', 'reviewOutcome', 'reviewIssue'],
                preserveScroll: true,
                ...requestFeedback,
                onSuccess: (page) => {
                    onRequestSuccess();

                    if (page.props.reviewOutcome === 'decision_saved') {
                        setSelectedId(null);
                        setNote('');
                        changeDecision('approve');
                        requestAnimationFrame(() =>
                            queueHeadingRef.current?.focus(),
                        );
                    }
                },
                onFinish: () => {
                    setProcessingId(null);
                    onQueueLoadingChange(false);
                },
            },
        );
    }

    const isProcessing = processingId !== null;
    const isDisabled = isQueueLoading || isProcessing;

    return {
        selected,
        selectedId,
        setSelectedId,
        processingId,
        isProcessing,
        isDisabled,
        decision,
        reasonCode,
        setReasonCode,
        note,
        setNote,
        fieldErrors,
        decisionHeadingRef,
        queueHeadingRef,
        changeDecision,
        updateFilters,
        refreshQueue,
        beginReview,
        abandonReview,
        submitDecision,
    };
}
