import { LoaderCircle } from 'lucide-react';
import { IntegrationFilterStrip } from '@/pages/campus/integrations/_components/integration-filter-strip';
import { IntegrationPagination } from '@/pages/campus/integrations/_components/integration-pagination';
import { IntegrationSyncTable } from '@/pages/campus/integrations/_components/integration-sync-table';
import type { useCampusIntegrations } from '@/pages/campus/integrations/_hooks/use-campus-integrations';
import type {
    AcademicIntegrationsProps,
    SyncsPaginated,
} from '@/pages/campus/integrations/_types/integration-types';
import { DashboardArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';

interface IntegrationSyncQueueProps {
    syncs: SyncsPaginated;
    filters: AcademicIntegrationsProps['filters'];
    ctrl: ReturnType<typeof useCampusIntegrations>;
}

export function IntegrationSyncQueue({
    syncs,
    filters,
    ctrl,
}: IntegrationSyncQueueProps) {
    const {
        isPending,
        busy,
        statusFilter,
        setStatusFilter,
        connectionFilter,
        setConnectionFilter,
        applyFilters,
        setFeedback,
        setConfirmingRetry,
        setReasonError,
        setConfirmingReconcile,
        setReconcileReason,
        setActiveSync,
    } = ctrl;

    return (
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
            <IntegrationFilterStrip
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                connectionFilter={connectionFilter}
                setConnectionFilter={setConnectionFilter}
                statusOptions={filters.status_options}
                connectionOptions={filters.connection_options}
                busy={busy}
                onSubmit={applyFilters}
            />
            <div aria-busy={isPending} className="min-w-0 space-y-3">
                {isPending && (
                    <p
                        role="status"
                        className="flex items-center gap-2 rounded-xl bg-accent p-3 text-sm text-primary"
                    >
                        <LoaderCircle
                            aria-hidden="true"
                            className="size-4 animate-spin motion-reduce:animate-none"
                        />
                        Memperbarui antrean. Hasil sebelumnya tetap terlihat.
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
                            Ubah filter untuk melihat riwayat lain. Status
                            muncul setelah request sinkronisasi tersedia.
                        </p>
                    </div>
                ) : (
                    <IntegrationSyncTable
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
            <IntegrationPagination
                currentPage={syncs.meta.current_page}
                lastPage={syncs.meta.last_page}
                disabled={busy}
                onPageChange={applyFilters}
            />
        </section>
    );
}
