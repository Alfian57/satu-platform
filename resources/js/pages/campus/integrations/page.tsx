import { Head } from '@inertiajs/react';
import { CheckCircle2, ServerCog, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppPage } from '@/layouts/_components/app-page';
import { CampusOperationHeader } from '@/pages/campus/_components/campus-operation-layout';
import { IntegrationActionModals } from '@/pages/campus/integrations/_components/integration-action-modals';
import { IntegrationConnectionOverview } from '@/pages/campus/integrations/_components/integration-connection-overview';
import { IntegrationForbiddenSection } from '@/pages/campus/integrations/_components/integration-forbidden-section';
import { IntegrationSyncQueue } from '@/pages/campus/integrations/_components/integration-sync-queue';
import { IntegrationWorkflowGuide } from '@/pages/campus/integrations/_components/integration-workflow-guide';
import { useCampusIntegrations } from '@/pages/campus/integrations/_hooks/use-campus-integrations';
import type { AcademicIntegrationsProps } from '@/pages/campus/integrations/_types/integration-types';

export default function AcademicIntegrations({
    institution,
    connections,
    syncs,
    filters,
    forbidden,
}: AcademicIntegrationsProps) {
    const ctrl = useCampusIntegrations({ institution, filters, forbidden });
    const {
        busy,
        feedback,
        success,
        unavailable,
        applyFilters,
        setProviderError,
        setCreatingConnection,
    } = ctrl;

    return (
        <>
            <Head title="Sinkronisasi Akademik | SATU" />
            <AppPage>
                <div className="space-y-6" data-test="campus-integrations-root">
                    <CampusOperationHeader
                        theme="integrations"
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
                        <IntegrationForbiddenSection />
                    ) : (
                        <>
                            {connections.some((c) => c.mode === 'sandbox') && (
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
                            <IntegrationConnectionOverview
                                connections={connections}
                                onCreate={
                                    busy
                                        ? undefined
                                        : () => {
                                              setProviderError(null);
                                              setCreatingConnection(true);
                                          }
                                }
                            />
                            <IntegrationWorkflowGuide />
                            <IntegrationSyncQueue
                                syncs={syncs}
                                filters={filters}
                                ctrl={ctrl}
                            />
                        </>
                    )}
                </div>
            </AppPage>
            <IntegrationActionModals ctrl={ctrl} />
        </>
    );
}

AcademicIntegrations.layout = {
    breadcrumbs: [
        { title: 'Operasi Kampus', href: '#' },
        { title: 'Sinkronisasi Akademik', href: '#' },
    ],
};
