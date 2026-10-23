import { IntegrationCreateConnectionModal } from '@/pages/campus/integrations/_components/integration-create-connection-modal';
import { IntegrationReconcileDialog } from '@/pages/campus/integrations/_components/integration-reconcile-dialog';
import { IntegrationRetryDialog } from '@/pages/campus/integrations/_components/integration-retry-dialog';
import { IntegrationSyncTimelineModal } from '@/pages/campus/integrations/_components/integration-sync-timeline-modal';
import type { useCampusIntegrations } from '@/pages/campus/integrations/_hooks/use-campus-integrations';

interface IntegrationActionModalsProps {
    ctrl: ReturnType<typeof useCampusIntegrations>;
}

export function IntegrationActionModals({
    ctrl,
}: IntegrationActionModalsProps) {
    const {
        creatingConnection,
        setCreatingConnection,
        busy,
        unavailable,
        providerKey,
        setProviderKey,
        providerError,
        feedback,
        submitCreateConnection,
        confirmingRetry,
        processing,
        setConfirmingRetry,
        submitCommand,
        confirmingReconcile,
        setConfirmingReconcile,
        reconcileReason,
        setReconcileReason,
        reasonError,
        activeSync,
        setActiveSync,
    } = ctrl;

    return (
        <>
            <IntegrationCreateConnectionModal
                open={creatingConnection}
                onOpenChange={(open) => {
                    if (!open && !busy) {
                        setCreatingConnection(false);
                        setProviderKey('');
                    }
                }}
                busy={busy}
                unavailable={unavailable}
                providerKey={providerKey}
                setProviderKey={setProviderKey}
                providerError={providerError}
                feedback={feedback}
                onCancel={() => {
                    setCreatingConnection(false);
                    setProviderKey('');
                }}
                onSubmit={submitCreateConnection}
            />
            <IntegrationRetryDialog
                confirmingRetry={confirmingRetry}
                processing={processing}
                feedback={feedback}
                onCancel={() => setConfirmingRetry(null)}
                onConfirm={() => submitCommand('retry')}
            />
            <IntegrationReconcileDialog
                confirmingReconcile={confirmingReconcile}
                processing={processing}
                reconcileReason={reconcileReason}
                setReconcileReason={setReconcileReason}
                reasonError={reasonError}
                feedback={feedback}
                onCancel={() => {
                    setConfirmingReconcile(null);
                    setReconcileReason('');
                }}
                onSubmit={() => submitCommand('reconcile')}
            />
            <IntegrationSyncTimelineModal
                activeSync={activeSync}
                onClose={() => setActiveSync(null)}
            />
        </>
    );
}
