import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    History,
    LoaderCircle,
    RefreshCw,
    RotateCcw,
    ServerCog,
    ShieldAlert,
    Sparkles,
    TimerReset,
} from 'lucide-react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import {
    CampusOperationHeader,
    CampusTechnicalDetails,
    campusControlClass,
} from '@/components/campus-operation-layout';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    index as integrationsIndex,
    store as integrationsStore,
} from '@/routes/campus/integrations';
import { reconcile, retry } from '@/routes/campus/integrations/syncs';

interface TimelineEntry {
    status: string;
    reason: string | null;
    created_at: string;
}

interface SyncItem {
    id: number;
    connection_id: number;
    connection_provider: string | null;
    source: string;
    mapping_version: string;
    idempotency_key: string;
    payload_digest_short: string;
    status: string;
    attempts: number;
    external_reference: string | null;
    last_attempt_at: string | null;
    created_at: string;
    error: string | null;
    timeline: TimelineEntry[];
}

interface ConnectionItem {
    id: number;
    institution_id: number;
    provider_key: string;
    mode: 'sandbox' | 'real';
    mode_label: string;
    status: string;
    status_label: string;
    sync_count: number;
    created_at: string;
}

interface SyncsPaginated {
    data: SyncItem[];
    links: string[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface Props {
    institution: {
        id: number;
        name: string;
    } | null;
    connections: ConnectionItem[];
    syncs: SyncsPaginated;
    filters: {
        status: string;
        connection: number;
        status_options: { value: string; label: string }[];
        connection_options: { id: number; label: string }[];
    };
    forbidden: boolean;
}

const retryableStatuses = new Set([
    'failed',
    'retrying',
    'dead',
    'timeout',
    'validation_error',
    'conflict',
]);
const reconcilableStatuses = new Set(['dead', 'conflict', 'timeout', 'failed']);
const statusLabels: Record<string, string> = {
    queued: 'Dalam antrean',
    sending: 'Sedang dikirim',
    succeeded: 'Berhasil',
    failed: 'Gagal',
    retrying: 'Mencoba ulang',
    dead: 'Percobaan dihentikan',
    timeout: 'Waktu habis',
    validation_error: 'Validasi gagal',
    conflict: 'Konflik',
    reconciled: 'Direkonsiliasi',
};

function StatusBadge({ status }: { status: string }) {
    const verified = status === 'succeeded' || status === 'reconciled';
    const waiting =
        status === 'queued' || status === 'sending' || status === 'retrying';
    const Icon = verified ? CheckCircle2 : waiting ? Clock : ShieldAlert;

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                verified
                    ? 'border-verified/30 bg-verified-subtle text-verified-subtle-foreground'
                    : waiting
                      ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                      : 'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
            )}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {statusLabels[status] ?? status}
        </span>
    );
}

function syncDate(value: string | null) {
    if (!value || Number.isNaN(new Date(value).getTime())) {
        return 'Belum tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function ConnectionOverview({
    connections,
    onCreate,
}: {
    connections: ConnectionItem[];
    onCreate?: () => void;
}) {
    return (
        <section
            aria-labelledby="connections-heading"
            className="@container min-w-0"
        >
            <h2 id="connections-heading" className="mb-3 text-lg font-bold">
                Koneksi akademik
            </h2>
            {connections.length === 0 ? (
                <div className="flex items-start gap-3 rounded-3xl border border-border bg-white p-5 shadow-sm">
                    <ServerCog
                        aria-hidden="true"
                        className="mt-1 size-5 shrink-0 text-primary"
                    />
                    <div>
                        <h3 className="font-semibold">
                            Belum ada koneksi akademik
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Status sinkronisasi tersedia setelah koneksi kampus
                            dikonfigurasi melalui alur yang diizinkan. Halaman
                            ini tidak membuat koneksi baru.
                        </p>
                    </div>
                    {onCreate && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onCreate}
                            className="shrink-0 gap-1.5"
                        >
                            <Plus aria-hidden="true" className="size-4" />
                            Buat Koneksi Sandbox
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-3 @min-[42rem]:grid-cols-2 @min-[72rem]:grid-cols-3">
                    {connections.map((connection) => (
                        <article
                            key={connection.id}
                            className="min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                                        <ServerCog
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className="font-bold wrap-anywhere">
                                            {connection.provider_key}
                                        </h3>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {connection.sync_count} sinkronisasi
                                            tercatat
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                                        connection.mode === 'sandbox'
                                            ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                                            : 'border-primary/15 bg-accent text-primary',
                                    )}
                                >
                                    <Sparkles
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    {connection.mode === 'sandbox'
                                        ? 'Sandbox (uji coba)'
                                        : connection.mode_label}
                                </span>
                            </div>
                            <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
                                {connection.status === 'connected' ? (
                                    <CheckCircle2
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-verified"
                                    />
                                ) : (
                                    <ShieldAlert
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-pending-subtle-foreground"
                                    />
                                )}
                                {connection.status_label}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function SyncTable({
    syncs,
    disabled,
    onRetry,
    onReconcile,
    onOpenTimeline,
}: {
    syncs: SyncItem[];
    disabled: boolean;
    onRetry: (sync: SyncItem) => void;
    onReconcile: (sync: SyncItem) => void;
    onOpenTimeline: (sync: SyncItem) => void;
}) {
    return (
        <div className="@container min-w-0" data-test="sync-ledger">
            <ul className="grid gap-4 @min-[56rem]:grid-cols-2">
                {syncs.map((sync) => (
                    <li
                        key={sync.id}
                        className="min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-primary">
                                    Berkas SY-{sync.id}
                                </p>
                                <h3 className="mt-1 text-xl font-bold wrap-anywhere">
                                    {sync.source}
                                </h3>
                            </div>
                            <StatusBadge status={sync.status} />
                        </div>
                        <dl className="mt-4 grid gap-3 border-y border-border py-3 sm:grid-cols-2">
                            <div className="min-w-0">
                                <dt className="text-xs text-muted-foreground">
                                    Versi pemetaan
                                </dt>
                                <dd className="mt-1 text-sm font-semibold wrap-anywhere">
                                    {sync.mapping_version || 'Belum tersedia'}
                                </dd>
                            </div>
                            <div className="min-w-0">
                                <dt className="text-xs text-muted-foreground">
                                    Jumlah percobaan
                                </dt>
                                <dd className="mt-1 text-sm font-semibold">
                                    {sync.attempts}
                                </dd>
                            </div>
                            <div className="min-w-0">
                                <dt className="text-xs text-muted-foreground">
                                    Koneksi
                                </dt>
                                <dd className="mt-1 text-sm wrap-anywhere">
                                    {sync.connection_provider ??
                                        'Belum tersedia'}
                                </dd>
                            </div>
                            <div className="min-w-0">
                                <dt className="text-xs text-muted-foreground">
                                    Percobaan terakhir
                                </dt>
                                <dd className="mt-1 text-sm">
                                    {syncDate(sync.last_attempt_at)}
                                </dd>
                            </div>
                        </dl>
                        <div className="mt-3 min-w-0 rounded-2xl bg-accent/50 p-3">
                            <p className="text-xs font-semibold text-primary">
                                Pesan proses
                            </p>
                            <p className="mt-1 text-sm leading-6 wrap-anywhere text-muted-foreground">
                                {sync.error ??
                                    (sync.external_reference
                                        ? `Referensi ${sync.external_reference}`
                                        : sync.status === 'queued'
                                          ? 'Menunggu pemrosesan. Belum ada hasil dari penyedia.'
                                          : 'Belum ada pesan proses.')}
                            </p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={disabled}
                                onClick={() => onOpenTimeline(sync)}
                                className="min-h-11 text-primary"
                            >
                                <History
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Riwayat
                            </Button>
                            {retryableStatuses.has(sync.status) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={disabled}
                                    onClick={() => onRetry(sync)}
                                    className="min-h-11"
                                >
                                    <RefreshCw
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Ulangi
                                </Button>
                            )}
                            {reconcilableStatuses.has(sync.status) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={disabled}
                                    onClick={() => onReconcile(sync)}
                                    className="min-h-11"
                                >
                                    <TimerReset
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Rekonsiliasi
                                </Button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function AcademicIntegrations({
    institution,
    connections,
    syncs,
    filters,
    forbidden,
}: Props) {
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

    return (
        <>
            <Head title="Sinkronisasi Akademik | SATU" />
            <AppPage>
                <div className="space-y-6" data-test="campus-integrations-root">
                    <CampusOperationHeader
                        title="Sinkronisasi akademik"
                        description="Pantau hasil pengiriman aktivitas dan versi kredit. Bedakan percobaan ulang dari pencatatan penyelesaian manual."
                        institution={
                            unavailable ? null : (institution?.name ?? null)
                        }
                        icon={ServerCog}
                    />
                    {feedback && (
                        <div
                            role="alert"
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm text-correction-subtle-foreground"
                        >
                            <p>{feedback}</p>
                            {institution && (
                                <Button
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => applyFilters()}
                                >
                                    Muat ulang
                                </Button>
                            )}
                        </div>
                    )}
                    {success && (
                        <p
                            role="status"
                            className="flex items-start gap-2 rounded-2xl border border-verified/30 bg-verified-subtle p-4 text-sm text-verified-subtle-foreground"
                        >
                            <CheckCircle2
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            {success}
                        </p>
                    )}
                    {unavailable ? (
                        <section
                            data-test="integrations-forbidden"
                            className="rounded-3xl border border-correction/30 bg-correction-subtle p-5"
                        >
                            <ShieldAlert
                                aria-hidden="true"
                                className="size-6 text-correction-subtle-foreground"
                            />
                            <h2 className="mt-3 text-lg font-bold">
                                Akses integrasi akademik tidak tersedia
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-correction-subtle-foreground">
                                Periksa izin operator dan institusi aktif. Data
                                sebelumnya tidak ditampilkan selama akses tidak
                                tersedia.
                            </p>
                        </section>
                    ) : (
                        <>
                            {connections.some(
                                (connection) => connection.mode === 'sandbox',
                            ) && (
                                <div className="flex items-start gap-3 rounded-2xl border border-pending/30 bg-pending-subtle p-4 text-sm leading-6 text-pending-subtle-foreground">
                                    <Sparkles
                                        aria-hidden="true"
                                        className="mt-1 size-4 shrink-0"
                                    />
                                    <p>
                                        Koneksi berlabel Sandbox memakai
                                        lingkungan uji coba. Hasilnya bukan
                                        bukti pengiriman ke sistem akademik
                                        nyata.
                                    </p>
                                </div>
                            )}
                            <ConnectionOverview connections={connections} />
                            <CampusTechnicalDetails title="Kapan memilih Ulangi atau Rekonsiliasi?">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="font-semibold text-foreground">
                                            Ulangi pengiriman
                                        </p>
                                        <p className="mt-1">
                                            Mengantrekan kembali payload yang
                                            sama sesuai status yang diizinkan.
                                            Hasil akhir tetap mengikuti respons
                                            penyedia.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">
                                            Rekonsiliasi manual
                                        </p>
                                        <p className="mt-1">
                                            Mencatat bahwa masalah sudah
                                            diselesaikan secara manual. Wajib
                                            menyertakan alasan, bukan mengirim
                                            ulang payload.
                                        </p>
                                    </div>
                                </div>
                            </CampusTechnicalDetails>
                            <section
                                aria-labelledby="sync-queue-heading"
                                className="min-w-0 space-y-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h2
                                        id="sync-queue-heading"
                                        tabIndex={-1}
                                        className="text-lg font-bold focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        Hasil dan antrean sinkronisasi
                                    </h2>
                                    <span
                                        className="rounded-full border border-primary/15 bg-accent px-3 py-1 text-xs font-semibold"
                                        data-test="sync-total"
                                    >
                                        {syncs.meta.total} sesuai filter
                                    </span>
                                </div>
                                <form
                                    aria-label="Filter sinkronisasi akademik"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        applyFilters();
                                    }}
                                    className="grid min-w-0 items-end gap-4 rounded-3xl border border-border bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:p-5"
                                >
                                    <label className="grid min-w-0 gap-2 text-sm font-semibold">
                                        Status
                                        <select
                                            value={statusFilter}
                                            onChange={(event) =>
                                                setStatusFilter(
                                                    event.target.value,
                                                )
                                            }
                                            disabled={busy}
                                            className={cn(
                                                campusControlClass,
                                                'cursor-pointer',
                                            )}
                                        >
                                            <option value="all">
                                                Semua status
                                            </option>
                                            {filters.status_options.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {statusLabels[
                                                            option.value
                                                        ] ?? option.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>
                                    <label className="grid min-w-0 gap-2 text-sm font-semibold">
                                        Koneksi
                                        <select
                                            value={connectionFilter}
                                            onChange={(event) =>
                                                setConnectionFilter(
                                                    event.target.value,
                                                )
                                            }
                                            disabled={busy}
                                            className={cn(
                                                campusControlClass,
                                                'cursor-pointer',
                                            )}
                                        >
                                            <option value="0">
                                                Semua koneksi
                                            </option>
                                            {filters.connection_options.map(
                                                (option) => (
                                                    <option
                                                        key={option.id}
                                                        value={String(
                                                            option.id,
                                                        )}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>
                                    <Button type="submit" disabled={busy}>
                                        <RotateCcw
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        Terapkan
                                    </Button>
                                </form>
                                <div
                                    aria-busy={isPending}
                                    className="min-w-0 space-y-3"
                                >
                                    {isPending && (
                                        <p
                                            role="status"
                                            className="flex items-center gap-2 rounded-xl bg-accent p-3 text-sm text-primary"
                                        >
                                            <LoaderCircle
                                                aria-hidden="true"
                                                className="size-4 animate-spin motion-reduce:animate-none"
                                            />
                                            Memperbarui antrean. Hasil
                                            sebelumnya tetap terlihat.
                                        </p>
                                    )}
                                    {syncs.data.length === 0 ? (
                                        <div
                                            className="rounded-3xl border border-border bg-white p-6 text-center shadow-sm"
                                            data-test="sync-empty"
                                        >
                                            <DashboardArchiveArt className="mx-auto size-20" />
                                            <h3 className="mt-3 text-lg font-bold">
                                                Belum ada hasil pada filter ini
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                Ubah filter untuk melihat
                                                riwayat lain. Status muncul
                                                setelah request sinkronisasi
                                                tersedia.
                                            </p>
                                        </div>
                                    ) : (
                                        <SyncTable
                                            syncs={syncs.data}
                                            disabled={busy}
                                            onRetry={(sync) => {
                                                setFeedback(null);
                                                setConfirmingRetry(sync);
                                            }}
                                            onReconcile={(sync) => {
                                                setFeedback(null);
                                                setReasonError(null);
                                                setConfirmingReconcile(sync);
                                                setReconcileReason('');
                                            }}
                                            onOpenTimeline={setActiveSync}
                                        />
                                    )}
                                </div>
                                {syncs.meta.last_page > 1 && (
                                    <nav
                                        aria-label="Paginasi sinkronisasi akademik"
                                        className="flex flex-wrap items-center justify-between gap-3"
                                    >
                                        <p className="text-xs text-muted-foreground">
                                            Halaman {syncs.meta.current_page}{' '}
                                            dari {syncs.meta.last_page}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                disabled={
                                                    busy ||
                                                    syncs.meta.current_page ===
                                                        1
                                                }
                                                onClick={() =>
                                                    applyFilters(
                                                        syncs.meta
                                                            .current_page - 1,
                                                    )
                                                }
                                            >
                                                Sebelumnya
                                            </Button>
                                            <Button
                                                variant="outline"
                                                disabled={
                                                    busy ||
                                                    syncs.meta.current_page ===
                                                        syncs.meta.last_page
                                                }
                                                onClick={() =>
                                                    applyFilters(
                                                        syncs.meta
                                                            .current_page + 1,
                                                    )
                                                }
                                            >
                                                Berikutnya
                                            </Button>
                                        </div>
                                    </nav>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </AppPage>
            <Dialog
                open={creatingConnection}
                onOpenChange={(open) => {
                    if (!open) {
                        setCreatingConnection(false);
                        setProviderKey('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Buat koneksi akademik sandbox</DialogTitle>
                        <DialogDescription>
                            Tambahkan provider koneksi sandbox untuk
                            mensimulasikan sinkronisasi kredit akademik dan
                            memetakan aktivitas mahasiswa.
                        </DialogDescription>
                    </DialogHeader>
                    <label className="grid gap-1.5">
                        <span className="font-label text-label font-semibold text-muted-foreground">
                            Kunci penyedia (Provider Key)
                        </span>
                        <input
                            type="text"
                            value={providerKey}
                            onChange={(e) => setProviderKey(e.target.value)}
                            placeholder="Contoh: siakad, feeder, atau pd_dikti"
                            className="h-control-md rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        />
                        <span className="text-xs text-muted-foreground">
                            Koneksi dibuat dalam mode Sandbox untuk pengujian
                            terisolasi.
                        </span>
                    </label>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setCreatingConnection(false);
                                setProviderKey('');
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={submitCreateConnection}
                            disabled={isPending || !providerKey.trim()}
                        >
                            {isPending ? 'Menyimpan...' : 'Simpan Koneksi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={confirmingRetry !== null}
                onOpenChange={(open) => {
                    if (!open && !processing) {
                        setConfirmingRetry(null);
                    }
                }}
            >
                <DialogContent
                    closeButtonDisabled={processing}
                    onEscapeKeyDown={(event) => {
                        if (processing) {
                            event.preventDefault();
                        }
                    }}
                    onInteractOutside={(event) => {
                        if (processing) {
                            event.preventDefault();
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Ulangi sinkronisasi?</DialogTitle>
                        <DialogDescription>
                            Payload versi terakhir masuk antrean lagi.
                            Pengiriman memakai kunci idempotensi untuk mencegah
                            duplikasi. Ini bukan jaminan sukses penyedia.
                        </DialogDescription>
                    </DialogHeader>
                    {confirmingRetry && (
                        <p className="rounded-2xl bg-accent p-4 text-sm leading-6 wrap-anywhere">
                            {confirmingRetry.source}. Versi pemetaan{' '}
                            {confirmingRetry.mapping_version}.
                        </p>
                    )}
                    {feedback && (
                        <p
                            role="alert"
                            className="text-sm leading-6 text-correction-subtle-foreground"
                        >
                            {feedback}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            disabled={processing}
                            onClick={() => setConfirmingRetry(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            disabled={processing}
                            onClick={() => submitCommand('retry')}
                        >
                            {processing ? 'Memproses...' : 'Ya, ulangi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog
                open={confirmingReconcile !== null}
                onOpenChange={(open) => {
                    if (!open && !processing) {
                        setConfirmingReconcile(null);
                        setReconcileReason('');
                    }
                }}
            >
                <DialogContent
                    closeButtonDisabled={processing}
                    onEscapeKeyDown={(event) => {
                        if (processing) {
                            event.preventDefault();
                        }
                    }}
                    onInteractOutside={(event) => {
                        if (processing) {
                            event.preventDefault();
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Rekonsiliasi manual</DialogTitle>
                        <DialogDescription>
                            Tandai berkas telah diselesaikan secara manual.
                            Alasan dan keputusan menjadi riwayat yang tidak
                            dapat ditimpa.
                        </DialogDescription>
                    </DialogHeader>
                    {confirmingReconcile && (
                        <p className="rounded-2xl bg-accent p-4 text-sm leading-6 wrap-anywhere">
                            {confirmingReconcile.source}. Versi pemetaan{' '}
                            {confirmingReconcile.mapping_version}.
                        </p>
                    )}
                    <form
                        aria-label="Rekonsiliasi manual"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitCommand('reconcile');
                        }}
                        className="grid gap-4"
                    >
                        <div className="grid gap-2">
                            <label
                                htmlFor="sync-reconcile-reason"
                                className="text-sm font-semibold"
                            >
                                Alasan rekonsiliasi (wajib)
                            </label>
                            <textarea
                                id="sync-reconcile-reason"
                                required
                                rows={3}
                                maxLength={1000}
                                disabled={processing}
                                value={reconcileReason}
                                onChange={(event) =>
                                    setReconcileReason(event.target.value)
                                }
                                placeholder="Jelaskan bagaimana masalah telah diselesaikan."
                                aria-invalid={Boolean(reasonError)}
                                aria-describedby="sync-reason-help sync-reason-error"
                                className={cn(campusControlClass, 'resize-y')}
                            />
                            <p
                                id="sync-reason-help"
                                className="text-xs leading-5 text-muted-foreground"
                            >
                                Maksimum 1.000 karakter. Rekonsiliasi tidak
                                mengirim ulang payload.
                            </p>
                            {reasonError && (
                                <p
                                    role="alert"
                                    id="sync-reason-error"
                                    className="text-sm text-correction-subtle-foreground"
                                >
                                    {reasonError}
                                </p>
                            )}
                        </div>
                        {feedback && (
                            <p
                                role="alert"
                                className="text-sm leading-6 text-correction-subtle-foreground"
                            >
                                {feedback}
                            </p>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                                onClick={() => {
                                    setConfirmingReconcile(null);
                                    setReconcileReason('');
                                }}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    processing || reconcileReason.trim() === ''
                                }
                            >
                                {processing
                                    ? 'Memproses...'
                                    : 'Catat rekonsiliasi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog
                open={activeSync !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setActiveSync(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Riwayat sinkronisasi</DialogTitle>
                        <DialogDescription className="wrap-anywhere">
                            {activeSync
                                ? `${activeSync.source}. Versi pemetaan ${activeSync.mapping_version}.`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {activeSync &&
                        (activeSync.timeline.length === 0 ? (
                            <p className="text-sm leading-6 text-muted-foreground">
                                Riwayat proses belum tersedia untuk berkas ini.
                            </p>
                        ) : (
                            <ol className="max-h-80 space-y-4 overflow-y-auto">
                                {[...activeSync.timeline]
                                    .reverse()
                                    .map((entry, entryIndex) => (
                                        <li
                                            key={`${entry.created_at}-${entryIndex}`}
                                            className="min-w-0 border-b border-border pb-4 last:border-0"
                                        >
                                            <StatusBadge
                                                status={entry.status}
                                            />
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {syncDate(entry.created_at)}
                                            </p>
                                            {entry.reason && (
                                                <p className="mt-2 text-sm leading-6 wrap-anywhere text-muted-foreground">
                                                    {entry.reason}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                            </ol>
                        ))}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setActiveSync(null)}
                        >
                            Tutup riwayat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

AcademicIntegrations.layout = {
    breadcrumbs: [
        { title: 'Operasi Kampus', href: '#' },
        { title: 'Sinkronisasi Akademik', href: '#' },
    ],
};
