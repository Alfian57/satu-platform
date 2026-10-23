import { History, RefreshCw, TimerReset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntegrationStatusBadge } from '@/pages/campus/integrations/_components/integration-status-badge';
import {
    formatSyncDate,
    reconcilableStatuses,
    retryableStatuses,
} from '@/pages/campus/integrations/_types/integration-types';
import type { SyncItem } from '@/pages/campus/integrations/_types/integration-types';

interface IntegrationSyncTableProps {
    syncs: SyncItem[];
    disabled: boolean;
    onRetry: (sync: SyncItem) => void;
    onReconcile: (sync: SyncItem) => void;
    onOpenTimeline: (sync: SyncItem) => void;
}

export function IntegrationSyncTable({
    syncs,
    disabled,
    onRetry,
    onReconcile,
    onOpenTimeline,
}: IntegrationSyncTableProps) {
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
                            <IntegrationStatusBadge status={sync.status} />
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
                                    {formatSyncDate(sync.last_attempt_at)}
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
