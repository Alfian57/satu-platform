import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import DeleteUser from '@/pages/settings/_components/delete-user';
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
    status?: string | null;
}

export default function DataRights({ summary, status }: Props) {
    const {
        form,
        active,
        operation,
        message,
        uncertain,
        refreshing,
        forbidden,
        busy,
        actions,
    } = useDataRightsForm();

    return (
        <>
            <Head title="Hak Data dan Privasi" />
            <div className="grid min-w-0 gap-6">
                {status && (
                    <p
                        role="status"
                        className="rounded-2xl border border-verified/25 bg-verified-subtle p-4 text-sm leading-6 text-verified-subtle-foreground"
                    >
                        {status}
                    </p>
                )}
                {message && (
                    <div
                        role="alert"
                        className="grid gap-3 rounded-2xl border border-correction/25 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground"
                    >
                        <p>{message}</p>
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 w-fit cursor-pointer disabled:cursor-not-allowed"
                            disabled={busy}
                            onClick={actions.refreshStatus}
                        >
                            {refreshing ? 'Memeriksa...' : 'Muat ulang status'}
                        </Button>
                    </div>
                )}
                {forbidden ? (
                    <p role="status">
                        Akses tidak tersedia. Ringkasan privat sebelumnya tidak
                        ditampilkan.
                    </p>
                ) : (
                    <>
                        <ConsentHistoryCard consents={summary.consents} />
                        <DataRightsOperationsGrid
                            onSelectOperation={actions.openOperation}
                            disabled={busy || uncertain}
                        />
                        <DeleteUser />
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
