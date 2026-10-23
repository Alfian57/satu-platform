import { Head } from '@inertiajs/react';
import { ConsentHistoryCard } from '@/pages/settings/data-rights/_components/consent-history-card';
import type { ConsentItem } from '@/pages/settings/data-rights/_components/consent-history-card';
import { DataRightsOperationsGrid } from '@/pages/settings/data-rights/_components/data-rights-operations-grid';
import { DataRightsRequestDialog } from '@/pages/settings/data-rights/_components/data-rights-request-dialog';
import { useDataRightsForm } from '@/pages/settings/data-rights/_hooks/use-data-rights-form';
import { edit as editDataRights } from '@/routes/data-rights';

interface Props {
    summary: {
        consents: ConsentItem[];
    };
}

export default function DataRights({ summary }: Props) {
    const {
        form,
        active,
        operation,
        message,
        uncertain,
        forbidden,
        busy,
        actions,
    } = useDataRightsForm();

    return (
        <>
            <Head title="Hak Data dan Privasi" />
            <div className="grid min-w-0 gap-4 sm:gap-5">
                {forbidden ? (
                    <p role="status" className="text-sm text-muted-foreground">
                        Akses tidak tersedia. Ringkasan privat sebelumnya tidak
                        ditampilkan.
                    </p>
                ) : (
                    <>
                        <DataRightsOperationsGrid
                            onSelectOperation={actions.openOperation}
                            disabled={busy || uncertain}
                        />
                        <ConsentHistoryCard consents={summary.consents} />
                    </>
                )}
                <DataRightsRequestDialog
                    open={active !== null}
                    operation={operation}
                    active={active}
                    reason={form.data.reason}
                    reasonError={form.errors.reason}
                    busy={busy}
                    uncertain={uncertain}
                    message={message}
                    onReasonChange={actions.setReason}
                    onClose={actions.closeDialog}
                    onSubmit={actions.submitRequest}
                    onRefresh={actions.refreshStatus}
                />
            </div>
        </>
    );
}

DataRights.layout = {
    breadcrumbs: [{ title: 'Hak Data dan Privasi', href: editDataRights() }],
};
