import { router } from '@inertiajs/react';
import { useState } from 'react';
import type {
    AcademicIntegrationsProps,
    SyncItem,
} from '@/pages/campus/integrations/_types/integration-types';
import {
    index as integrationsIndex,
    store as integrationsStore,
} from '@/routes/campus/integrations';
import { reconcile, retry } from '@/routes/campus/integrations/syncs';

export function useCampusIntegrations({
    institution,
    filters,
    forbidden,
}: Pick<AcademicIntegrationsProps, 'institution' | 'filters' | 'forbidden'>) {
    const [isPending, setPending] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [activeSync, setActiveSync] = useState<SyncItem | null>(null);
    const [confirmingRetry, setConfirmingRetry] = useState<SyncItem | null>(
        null,
    );
    const [confirmingReconcile, setConfirmingReconcile] =
        useState<SyncItem | null>(null);
    const [reconcileReason, setReconcileReason] = useState('');
    const [creatingConnection, setCreatingConnection] = useState(false);
    const [providerKey, setProviderKey] = useState('');
    const [providerError, setProviderError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [connectionFilter, setConnectionFilter] = useState(
        String(filters.connection),
    );
    const [feedback, setFeedback] = useState<string | null>(null);
    const [reasonError, setReasonError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [accessUnavailable, setAccessUnavailable] = useState(false);

    const busy = isPending || processing;
    const unavailable = forbidden || accessUnavailable || institution === null;

    function requestFailure(status?: number) {
        if (status === 403 || status === 404) {
            setAccessUnavailable(true);
            setConfirmingRetry(null);
            setConfirmingReconcile(null);
            setActiveSync(null);
        }

        setFeedback(
            'Hasil request belum dapat dikonfirmasi. Periksa koneksi atau akses, lalu muat ulang sebelum mencoba kembali.',
        );

        return false;
    }

    function submitCreateConnection() {
        if (!institution || busy || unavailable || !providerKey.trim()) {
            return;
        }

        setProcessing(true);
        setFeedback(null);
        setProviderError(null);
        setSuccess(null);

        router.post(
            integrationsStore({ institution: institution.id }).url,
            { provider_key: providerKey.trim(), mode: 'sandbox' },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setCreatingConnection(false);
                    setProviderKey('');
                    setSuccess(
                        'Koneksi sandbox berhasil dibuat. Ini bukan koneksi akademik nyata.',
                    );
                },
                onError: (errors) =>
                    setProviderError(
                        errors.provider_key ||
                            errors.mode ||
                            'Koneksi belum tersimpan. Periksa isian.',
                    ),
                onHttpException: (response) => requestFailure(response.status),
                onNetworkError: () => requestFailure(),
                onFinish: () => setProcessing(false),
            },
        );
    }

    function applyFilters(page = 1) {
        if (!institution || busy) {
            return;
        }

        setPending(true);
        setFeedback(null);
        setSuccess(null);

        router.get(
            integrationsIndex({ institution: institution.id }).url,
            { status: statusFilter, connection: connectionFilter, page },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: () => {
                    setAccessUnavailable(false);
                    setActiveSync(null);
                },
                onError: () =>
                    setFeedback(
                        'Antrean belum diperbarui. Periksa filter dan coba lagi.',
                    ),
                onHttpException: (response) => requestFailure(response.status),
                onNetworkError: () => requestFailure(),
                onFinish: () => setPending(false),
            },
        );
    }

    function submitCommand(kind: 'retry' | 'reconcile') {
        const sync = kind === 'retry' ? confirmingRetry : confirmingReconcile;

        if (
            !sync ||
            !institution ||
            busy ||
            unavailable ||
            (kind === 'reconcile' && !reconcileReason.trim())
        ) {
            return;
        }

        setProcessing(true);
        setFeedback(null);
        setReasonError(null);
        setSuccess(null);
        const route = kind === 'retry' ? retry : reconcile;

        router.post(
            route({ institution: institution.id, id: sync.id }).url,
            kind === 'retry' ? {} : { reason: reconcileReason },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmingRetry(null);
                    setConfirmingReconcile(null);
                    setReconcileReason('');
                    setSuccess(
                        kind === 'retry'
                            ? 'Sinkronisasi masuk antrean untuk dicoba ulang. Ini belum berarti penyedia telah menyelesaikannya.'
                            : 'Penyelesaian manual tercatat. Riwayat sinkronisasi telah diperbarui.',
                    );
                    window.setTimeout(
                        () =>
                            document
                                .getElementById('sync-queue-heading')
                                ?.focus(),
                        0,
                    );
                },
                onError: (errors) => {
                    setReasonError(errors.reason ?? null);
                    setFeedback(
                        errors[kind] ??
                            errors.reason ??
                            'Perubahan belum disimpan. Periksa isian dan status berkas.',
                    );
                },
                onHttpException: (response) => requestFailure(response.status),
                onNetworkError: () => requestFailure(),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return {
        isPending,
        processing,
        activeSync,
        setActiveSync,
        confirmingRetry,
        setConfirmingRetry,
        confirmingReconcile,
        setConfirmingReconcile,
        reconcileReason,
        setReconcileReason,
        creatingConnection,
        setCreatingConnection,
        providerKey,
        setProviderKey,
        providerError,
        setProviderError,
        statusFilter,
        setStatusFilter,
        connectionFilter,
        setConnectionFilter,
        feedback,
        setFeedback,
        reasonError,
        setReasonError,
        success,
        setSuccess,
        accessUnavailable,
        busy,
        unavailable,
        submitCreateConnection,
        applyFilters,
        submitCommand,
    };
}
