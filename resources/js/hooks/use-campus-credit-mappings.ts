import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { CreditMappingItem } from '@/components/campus/credits/credit-types';
import {
    activate,
    index,
    retire,
    store,
} from '@/routes/campus/credit-mappings';

export function useCampusCreditMappings({
    institutionId,
    mappings,
}: {
    institutionId: number;
    mappings: CreditMappingItem[];
}) {
    const form = useForm({
        activity_type: 'project',
        credit_amount: '3.0',
        reason: '',
    });
    const [confirmation, setConfirmation] = useState<{
        mapping: CreditMappingItem;
        action: 'activate' | 'retire';
    } | null>(null);
    const [processing, setProcessing] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [accessUnavailable, setAccessUnavailable] = useState(false);

    const busy = processing || form.processing;
    const activeCount = mappings.filter(
        (mapping) => mapping.status === 'active',
    ).length;
    const draftCount = mappings.filter(
        (mapping) => mapping.status === 'draft',
    ).length;

    const handleHttpFailure = (status: number): false => {
        if (status === 403 || status === 404) {
            setAccessUnavailable(true);
            setConfirmation(null);
        }

        setFeedback(
            'Hasil perubahan belum dapat dikonfirmasi. Muat ulang aturan sebelum mencoba kembali.',
        );

        return false;
    };

    const handleNetworkFailure = (): false => {
        setFeedback(
            'Koneksi terputus. Hasil perubahan belum dapat dikonfirmasi. Periksa koneksi dan muat ulang aturan.',
        );

        return false;
    };

    const createDraft = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (busy || accessUnavailable) {
            return;
        }

        setFeedback(null);
        setSuccess(null);
        form.transform((data) => ({
            ...data,
            credit_amount: Number(data.credit_amount),
            reason: data.reason || undefined,
        }));
        form.post(store.url({ institution: institutionId }), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset('reason');
                setSuccess(
                    'Draft pemetaan kredit tersimpan. Periksa aturan sebelum mengaktifkannya.',
                );
            },
            onError: () =>
                setFeedback(
                    'Draft belum disimpan. Periksa isian yang ditandai.',
                ),
            onHttpException: (response) => handleHttpFailure(response.status),
            onNetworkError: handleNetworkFailure,
        });
    };

    const confirmAction = (): void => {
        if (!confirmation || busy || accessUnavailable) {
            return;
        }

        setProcessing(true);
        setFeedback(null);
        setSuccess(null);
        const action = confirmation.action;
        const route = action === 'activate' ? activate : retire;
        router.post(
            route({
                institution: institutionId,
                mapping: confirmation.mapping.id,
            }).url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmation(null);
                    setSuccess(
                        action === 'activate'
                            ? 'Aturan pemetaan kredit diaktifkan. Riwayat versi tetap tersimpan.'
                            : 'Aturan pemetaan kredit dihentikan. Riwayat versi tetap tersimpan.',
                    );
                    window.setTimeout(
                        () =>
                            document
                                .getElementById('credit-mappings-heading')
                                ?.focus(),
                        0,
                    );
                },
                onError: (errors) =>
                    setFeedback(
                        errors.mapping ??
                            'Perubahan belum disimpan. Muat ulang aturan dan periksa statusnya.',
                    ),
                onHttpException: (response) =>
                    handleHttpFailure(response.status),
                onNetworkError: handleNetworkFailure,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const reloadMappings = (): void => {
        if (busy) {
            return;
        }

        setProcessing(true);
        router.get(
            index({ institution: institutionId }).url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setAccessUnavailable(false);
                    setFeedback(null);
                    setConfirmation(null);
                },
                onHttpException: (response) =>
                    handleHttpFailure(response.status),
                onNetworkError: handleNetworkFailure,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const openConfirmation = (
        mapping: CreditMappingItem,
        action: 'activate' | 'retire',
    ): void => {
        setFeedback(null);
        setConfirmation({ mapping, action });
    };

    const closeConfirmation = (): void => {
        if (!busy) {
            setConfirmation(null);
        }
    };

    return {
        form,
        confirmation,
        processing,
        feedback,
        success,
        accessUnavailable,
        busy,
        activeCount,
        draftCount,
        actions: {
            createDraft,
            confirmAction,
            reloadMappings,
            openConfirmation,
            closeConfirmation,
        },
    };
}
