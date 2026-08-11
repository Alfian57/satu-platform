import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    ExternalLink,
    RefreshCw,
    RotateCcw,
    ServerCog,
    ShieldAlert,
    Sparkles,
    TimerReset,
} from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { AppPage } from '@/components/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { index as integrationsIndex } from '@/routes/campus/integrations';
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

function statusTone(status: string) {
    switch (status) {
        case 'succeeded':
        case 'reconciled':
            return 'verified';
        case 'queued':
        case 'sending':
            return 'muted';
        case 'retrying':
        case 'conflict':
            return 'pending';
        default:
            return 'correction';
    }
}

function StatusBadge({ status }: { status: string }) {
    const tone = statusTone(status);

    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1.5 border font-label text-label font-semibold',
                tone === 'verified' &&
                    'border-verified/30 bg-verified-subtle text-verified-subtle-foreground',
                tone === 'pending' &&
                    'border-pending/30 bg-pending-subtle text-pending-subtle-foreground',
                tone === 'correction' &&
                    'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
                tone === 'muted' &&
                    'border-border bg-muted/50 text-muted-foreground',
            )}
        >
            <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-current"
            />
            {status}
        </Badge>
    );
}

function ConnectionOverview({
    connections,
}: {
    connections: ConnectionItem[];
}) {
    if (connections.length === 0) {
        return (
            <section
                aria-labelledby="connections-heading"
                className="rounded-xl border border-border/80 bg-card p-6"
            >
                <div className="flex items-start gap-3.5">
                    <span className="rounded-lg bg-accent p-2.5 text-primary">
                        <ServerCog aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                        <h2
                            id="connections-heading"
                            className="text-title font-bold"
                        >
                            Belum ada koneksi akademik
                        </h2>
                        <p className="mt-1 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                            Anda dapat membuat koneksi sandbox untuk mulai
                            memetakan aktivitas terverifikasi menjadi kredit.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section aria-labelledby="connections-heading">
            <h2 id="connections-heading" className="mb-3 text-title font-bold">
                Koneksi akademik
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
                {connections.map((connection) => (
                    <div
                        key={connection.id}
                        className="rounded-xl border border-border/80 bg-card p-5"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate font-semibold">
                                    {connection.provider_key}
                                </p>
                                <p className="mt-0.5 font-label text-label text-muted-foreground">
                                    {connection.sync_count} sync
                                </p>
                            </div>
                            <Badge
                                variant={
                                    connection.mode === 'real'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className={cn(
                                    'gap-1.5 font-label text-label font-semibold',
                                    connection.mode === 'sandbox' &&
                                        'border border-pending/30 bg-pending-subtle text-pending-subtle-foreground',
                                )}
                            >
                                {connection.mode === 'sandbox' ? (
                                    <Sparkles
                                        aria-hidden="true"
                                        className="size-3"
                                    />
                                ) : (
                                    <ExternalLink
                                        aria-hidden="true"
                                        className="size-3"
                                    />
                                )}
                                {connection.mode_label}
                            </Badge>
                        </div>
                        <div className="mt-4 flex items-center gap-2 border-t border-border/80 pt-3">
                            <StatusBadge status={connection.status} />
                            <span className="font-label text-label text-muted-foreground">
                                {connection.status_label}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function SyncTable({
    syncs,
    onRetry,
    onReconcile,
    onOpenTimeline,
}: {
    syncs: SyncItem[];
    onRetry: (sync: SyncItem) => void;
    onReconcile: (sync: SyncItem) => void;
    onOpenTimeline: (sync: SyncItem) => void;
}) {
    return (
        <div
            className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm"
            data-test="sync-ledger"
        >
            <div
                aria-hidden="true"
                className="hidden grid-cols-[minmax(7rem,0.7fr)_minmax(6rem,0.7fr)_7rem_minmax(9rem,1fr)_6.5rem_8.5rem] border-b border-border/80 bg-muted/50 font-label text-[11px] font-semibold tracking-wider text-muted-foreground uppercase lg:grid"
            >
                <span className="px-4 py-2.5">Sumber</span>
                <span className="border-l border-border/80 px-4 py-2.5">
                    Versi mapping
                </span>
                <span className="border-l border-border/80 px-4 py-2.5">
                    Status
                </span>
                <span className="border-l border-border/80 px-4 py-2.5">
                    Pesan
                </span>
                <span className="border-l border-border/80 px-4 py-2.5">
                    Coba ke
                </span>
                <span className="border-l border-border/80 px-4 py-2.5" />
            </div>

            <ul className="divide-y divide-border/80">
                {syncs.map((sync) => (
                    <li
                        key={sync.id}
                        className="border-b border-border/80 last:border-b-0"
                    >
                        <div className="grid gap-1 p-4 lg:grid-cols-[minmax(7rem,0.7fr)_minmax(6rem,0.7fr)_7rem_minmax(9rem,1fr)_6.5rem_8.5rem] lg:items-center lg:gap-0">
                            <div className="grid min-w-0 gap-1 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3">
                                <span className="font-label text-label font-semibold text-muted-foreground sm:hidden">
                                    Sumber
                                </span>
                                <span className="min-w-0 font-semibold wrap-anywhere">
                                    {sync.source}
                                </span>
                            </div>
                            <div className="grid min-w-0 gap-1 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3 lg:border-l lg:border-border/80 lg:px-4">
                                <span className="font-label text-label font-semibold text-muted-foreground sm:hidden">
                                    Versi
                                </span>
                                <span className="min-w-0 font-label text-label text-muted-foreground">
                                    {sync.mapping_version}
                                </span>
                            </div>
                            <div className="grid min-w-0 gap-1 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3 lg:border-l lg:border-border/80 lg:px-4">
                                <span className="font-label text-label font-semibold text-muted-foreground sm:hidden">
                                    Status
                                </span>
                                <span className="flex items-center">
                                    <StatusBadge status={sync.status} />
                                </span>
                            </div>
                            <div className="grid min-w-0 gap-1 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3 lg:border-l lg:border-border/80 lg:px-4">
                                <span className="font-label text-label font-semibold text-muted-foreground sm:hidden">
                                    Pesan
                                </span>
                                <span className="min-w-0 text-sm leading-5 wrap-anywhere text-muted-foreground">
                                    {sync.error ??
                                        (sync.external_reference
                                            ? `Referensi ${sync.external_reference}`
                                            : 'Belum ada pesan')}
                                </span>
                            </div>
                            <div className="grid min-w-0 gap-1 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3 lg:border-l lg:border-border/80 lg:px-4">
                                <span className="font-label text-label font-semibold text-muted-foreground sm:hidden">
                                    Coba ke
                                </span>
                                <span className="font-label text-label text-muted-foreground">
                                    {sync.attempts}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-2 lg:justify-end lg:border-l lg:border-border/80 lg:px-4 lg:pt-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary"
                                    onClick={() => onOpenTimeline(sync)}
                                >
                                    <Clock
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    Riwayat
                                </Button>
                                {retryableStatuses.has(sync.status) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="border-primary/40 text-primary"
                                        onClick={() => onRetry(sync)}
                                    >
                                        <RefreshCw
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                        Ulangi
                                    </Button>
                                )}
                                {(sync.status === 'dead' ||
                                    sync.status === 'conflict' ||
                                    sync.status === 'timeout' ||
                                    sync.status === 'failed') && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onReconcile(sync)}
                                    >
                                        <TimerReset
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                        Rekonsiliasi
                                    </Button>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function SyncLoading() {
    return (
        <div
            aria-busy="true"
            aria-live="polite"
            className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm"
            data-test="sync-loading"
            role="status"
        >
            <span className="sr-only">Memuat antrean sync akademik.</span>
            <div aria-hidden="true" className="grid">
                {[0, 1, 2].map((index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-4 border-b border-border/80 px-4 py-4 last:border-b-0"
                    >
                        <div className="grid gap-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                        <Skeleton className="h-6 w-16 self-center" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function SyncEmpty() {
    return (
        <div
            className="flex flex-col items-start gap-4 rounded-xl border border-border/80 bg-card px-5 py-8 shadow-sm"
            data-test="sync-empty"
        >
            <span className="rounded-lg bg-accent p-2.5 text-primary">
                <ShieldAlert aria-hidden="true" className="size-5" />
            </span>
            <div>
                <p className="font-semibold">Belum ada riwayat sync</p>
                <p className="mt-1 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                    Ketika aktivitas terverifikasi dipetakan, status dan hasil
                    sinkronisasi akan muncul di sini.
                </p>
            </div>
        </div>
    );
}

function Forbidden() {
    return (
        <div
            className="flex flex-col items-start gap-4 rounded-xl border border-correction/30 bg-correction-subtle px-5 py-8"
            data-test="integrations-forbidden"
        >
            <span className="rounded-lg bg-card p-2.5 text-correction">
                <ShieldAlert aria-hidden="true" className="size-5" />
            </span>
            <div>
                <p className="font-semibold text-correction-subtle-foreground">
                    Anda belum memiliki akses integrasi akademik
                </p>
                <p className="mt-1 max-w-[65ch] text-sm leading-6 text-correction-subtle-foreground">
                    Hubungi platform admin untuk mendapatkan akses campus
                    operator.
                </p>
            </div>
        </div>
    );
}

export default function AcademicIntegrations({
    connections,
    syncs,
    filters,
    forbidden,
}: Props) {
    const [isPending, startTransition] = useTransition();
    const [activeSync, setActiveSync] = useState<SyncItem | null>(null);
    const [confirmingRetry, setConfirmingRetry] = useState<SyncItem | null>(
        null,
    );
    const [confirmingReconcile, setConfirmingReconcile] =
        useState<SyncItem | null>(null);
    const [reconcileReason, setReconcileReason] = useState('');
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [connectionFilter, setConnectionFilter] = useState(
        String(filters.connection),
    );

    function applyFilters() {
        startTransition(() => {
            router.get(
                integrationsIndex().url,
                {
                    status: statusFilter,
                    connection: connectionFilter,
                },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        });
    }

    function goToPage(page: number) {
        startTransition(() => {
            router.get(
                integrationsIndex().url,
                {
                    status: statusFilter,
                    connection: connectionFilter,
                    page,
                },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        });
    }

    function submitRetry() {
        if (!confirmingRetry) {
            return;
        }

        const sync = confirmingRetry;
        startTransition(() => {
            router.post(
                retry(sync.id).url,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirmingRetry(null);
                        toast.success('Sync dijalankan ulang');
                    },
                    onError: (errors) => {
                        toast.error(errors.retry ?? 'Gagal menjalankan ulang');
                    },
                },
            );
        });
    }

    function submitReconcile() {
        if (!confirmingReconcile) {
            return;
        }

        const sync = confirmingReconcile;
        startTransition(() => {
            router.post(
                reconcile(sync.id).url,
                { reason: reconcileReason },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirmingReconcile(null);
                        setReconcileReason('');
                        toast.success('Sync direkonsiliasi');
                    },
                    onError: (errors) => {
                        toast.error(errors.reconcile ?? 'Gagal merekonsiliasi');
                    },
                },
            );
        });
    }

    const total = syncs.meta.total;

    return (
        <>
            <Head title="Integrasi Akademik" />
            <AppPage>
                <div className="mb-6 grid gap-4">
                    <header>
                        <p className="text-body text-muted-foreground">
                            Operasi akademik
                        </p>
                        <h1 className="mt-1 text-headline font-bold">
                            Status sync dan antrean peninjauan
                        </h1>
                    </header>

                    {!forbidden && connections.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/80 bg-card/60 px-3.5 py-2.5 text-xs text-muted-foreground shadow-2xs">
                            <Sparkles
                                aria-hidden="true"
                                className="size-4 shrink-0 text-pending"
                            />
                            <p className="leading-relaxed">
                                Data yang ditampilkan berasal dari sandbox dan
                                bersifat synthetic.
                            </p>
                        </div>
                    )}
                </div>

                {forbidden ? (
                    <Forbidden />
                ) : (
                    <div className="grid gap-7">
                        <ConnectionOverview connections={connections} />

                        <section aria-labelledby="sync-queue-heading">
                            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                                <h2
                                    id="sync-queue-heading"
                                    className="text-title font-bold"
                                >
                                    Antrean sync
                                </h2>
                                <span
                                    aria-label={`${total} sync`}
                                    className="inline-flex items-center rounded-full border border-primary/20 bg-accent px-2.5 py-0.5 font-label text-label font-bold text-accent-foreground"
                                    data-test="sync-total"
                                >
                                    {total}
                                </span>
                            </div>

                            <div className="mb-4 flex flex-wrap items-end gap-3">
                                <label className="grid gap-1">
                                    <span className="font-label text-label font-semibold text-muted-foreground">
                                        Status
                                    </span>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) =>
                                            setStatusFilter(e.target.value)
                                        }
                                        className="h-control-md rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
                                                    {option.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>

                                <label className="grid gap-1">
                                    <span className="font-label text-label font-semibold text-muted-foreground">
                                        Koneksi
                                    </span>
                                    <select
                                        value={connectionFilter}
                                        onChange={(e) =>
                                            setConnectionFilter(e.target.value)
                                        }
                                        className="h-control-md rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                    >
                                        <option value="0">Semua koneksi</option>
                                        {filters.connection_options.map(
                                            (option) => (
                                                <option
                                                    key={option.id}
                                                    value={String(option.id)}
                                                >
                                                    {option.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={applyFilters}
                                    disabled={isPending}
                                >
                                    <RotateCcw
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    Terapkan
                                </Button>
                            </div>

                            {isPending ? (
                                <SyncLoading />
                            ) : syncs.data.length === 0 ? (
                                <SyncEmpty />
                            ) : (
                                <SyncTable
                                    syncs={syncs.data}
                                    onRetry={setConfirmingRetry}
                                    onReconcile={setConfirmingReconcile}
                                    onOpenTimeline={setActiveSync}
                                />
                            )}

                            {!isPending && syncs.meta.last_page > 1 && (
                                <nav
                                    aria-label="Paginasi antrean sync"
                                    className="mt-4 flex items-center justify-between"
                                >
                                    <span className="font-label text-label text-muted-foreground">
                                        Halaman {syncs.meta.current_page} dari{' '}
                                        {syncs.meta.last_page}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                syncs.meta.current_page === 1
                                            }
                                            onClick={() =>
                                                goToPage(
                                                    syncs.meta.current_page - 1,
                                                )
                                            }
                                        >
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                syncs.meta.current_page ===
                                                syncs.meta.last_page
                                            }
                                            onClick={() =>
                                                goToPage(
                                                    syncs.meta.current_page + 1,
                                                )
                                            }
                                        >
                                            Berikutnya
                                        </Button>
                                    </div>
                                </nav>
                            )}
                        </section>
                    </div>
                )}
            </AppPage>

            <Dialog
                open={confirmingRetry !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirmingRetry(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ulangi sinkronisasi</DialogTitle>
                        <DialogDescription>
                            Mengirim ulang payload versi terakhir. Proses ini
                            tidak akan menduplikasi record yang sudah berhasil,
                            karena sync bersifat idempoten.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmingRetry(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={submitRetry}
                            disabled={isPending}
                        >
                            {isPending ? 'Memproses...' : 'Ulangi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={confirmingReconcile !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirmingReconcile(null);
                        setReconcileReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rekonsiliasi manual</DialogTitle>
                        <DialogDescription>
                            Tandai sync ini sebagai telah diselesaikan secara
                            manual. Tindakan ini dicatat di audit trail.
                        </DialogDescription>
                    </DialogHeader>
                    <label className="grid gap-1.5">
                        <span className="font-label text-label font-semibold text-muted-foreground">
                            Alasan rekonsiliasi
                        </span>
                        <textarea
                            value={reconcileReason}
                            onChange={(e) => setReconcileReason(e.target.value)}
                            placeholder="Jelaskan bagaimana konflik atau kegagalan diselesaikan..."
                            rows={3}
                            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        />
                    </label>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setConfirmingReconcile(null);
                                setReconcileReason('');
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={submitReconcile}
                            disabled={
                                isPending || reconcileReason.trim() === ''
                            }
                        >
                            {isPending ? 'Memproses...' : 'Rekonsiliasi'}
                        </Button>
                    </DialogFooter>
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
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Riwayat sync</DialogTitle>
                        <DialogDescription>
                            {activeSync
                                ? `${activeSync.source} - versi ${activeSync.mapping_version}`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {activeSync && (
                        <ol className="max-h-80 divide-y divide-border/80 overflow-y-auto rounded-lg border border-border/80">
                            {[...activeSync.timeline]
                                .reverse()
                                .map((entry, index) => (
                                    <li
                                        key={`${entry.created_at}-${index}`}
                                        className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 px-4 py-3"
                                    >
                                        <span className="flex items-start pt-1">
                                            {entry.status === 'succeeded' ||
                                            entry.status === 'reconciled' ? (
                                                <CheckCircle2
                                                    aria-hidden="true"
                                                    className="size-4 text-verified"
                                                />
                                            ) : entry.status === 'queued' ? (
                                                <Clock
                                                    aria-hidden="true"
                                                    className="size-4 text-muted-foreground"
                                                />
                                            ) : (
                                                <ShieldAlert
                                                    aria-hidden="true"
                                                    className="size-4 text-correction"
                                                />
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <StatusBadge
                                                    status={entry.status}
                                                />
                                                <time
                                                    dateTime={entry.created_at}
                                                    className="font-label text-label text-muted-foreground"
                                                >
                                                    {new Date(
                                                        entry.created_at,
                                                    ).toLocaleString('id-ID')}
                                                </time>
                                            </div>
                                            {entry.reason && (
                                                <p className="mt-1 text-sm leading-5 wrap-anywhere text-muted-foreground">
                                                    {entry.reason}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                        </ol>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveSync(null)}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
