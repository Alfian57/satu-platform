import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { CampusInclusionProps } from '@/components/campus/inclusion/inclusion-types';
import { index as inclusionIndex } from '@/routes/campus/inclusion';
import { store as storeInclusionReview } from '@/routes/campus/inclusion/reviews';

export function useCampusInclusion({
    institution,
    engineActive,
    filters,
    selectedSignal,
}: Pick<
    CampusInclusionProps,
    'institution' | 'engineActive' | 'filters' | 'selectedSignal'
>) {
    const [period, setPeriod] = useState(filters.period || '');
    const [restrictedOnly, setRestrictedOnly] = useState(
        filters.restricted_only,
    );
    const [isPending, setPending] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [accessUnavailable, setAccessUnavailable] = useState(false);

    const form = useForm({
        human_conclusion: 'acknowledged',
        support_action: '',
        reason: '',
    });

    const busy = isPending || form.processing;
    const available = engineActive && !accessUnavailable;

    function visit(signalId?: number, page = 1) {
        if (busy || !engineActive) {
            return;
        }

        setPending(true);
        setFeedback(null);
        setSuccess(null);

        router.get(
            inclusionIndex({ institution: institution.id }).url,
            {
                period: period || undefined,
                restricted_only: restrictedOnly ? '1' : '0',
                signal_id: signalId,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setAccessUnavailable(false);

                    if (
                        signalId !== undefined &&
                        signalId !== selectedSignal?.id
                    ) {
                        form.reset();
                        form.clearErrors();
                        window.setTimeout(
                            () =>
                                document
                                    .getElementById('inclusion-detail-heading')
                                    ?.focus(),
                            0,
                        );
                    }
                },
                onError: () =>
                    setFeedback(
                        'Antrean belum diperbarui. Periksa filter lalu coba lagi.',
                    ),
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        setAccessUnavailable(true);
                    }

                    setFeedback(
                        'Antrean tidak dapat dimuat. Periksa akses dan muat ulang.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setFeedback(
                        'Antrean belum diperbarui. Periksa koneksi lalu coba lagi.',
                    );

                    return false;
                },
                onFinish: () => setPending(false),
            },
        );
    }

    function submitReview(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedSignal || busy || !available) {
            return;
        }

        setFeedback(null);
        setSuccess(null);

        form.post(
            storeInclusionReview({
                institution: institution.id,
                signal: selectedSignal.id,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset('reason', 'support_action');
                    setSuccess(
                        'Keputusan peninjauan tersimpan. Riwayat telah diperbarui.',
                    );
                },
                onError: () =>
                    setFeedback(
                        'Keputusan belum tersimpan. Periksa isian yang ditandai.',
                    ),
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        setAccessUnavailable(true);
                    }

                    setFeedback(
                        'Keputusan belum dapat dikonfirmasi. Periksa akses dan muat ulang sebelum mencoba kembali.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setFeedback(
                        'Hasil penyimpanan belum dapat dikonfirmasi. Periksa koneksi dan muat ulang sebelum mencoba kembali.',
                    );

                    return false;
                },
            },
        );
    }

    return {
        period,
        setPeriod,
        restrictedOnly,
        setRestrictedOnly,
        isPending,
        feedback,
        success,
        accessUnavailable,
        form,
        busy,
        available,
        visit,
        submitReview,
    };
}
