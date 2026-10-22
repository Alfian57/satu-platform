import { Head } from '@inertiajs/react';
import { FileSpreadsheet } from 'lucide-react';
import { AppPage } from '@/components/app-page';
import { RosterCommitActionBar } from '@/components/campus/roster/roster-commit-action-bar';
import { RosterContextRail } from '@/components/campus/roster/roster-context-rail';
import { RosterHistoryTable } from '@/components/campus/roster/roster-history-table';
import { RosterPreviewLedger } from '@/components/campus/roster/roster-preview-ledger';
import type { RosterImportProps } from '@/components/campus/roster/roster-types';
import { RosterUploadCard } from '@/components/campus/roster/roster-upload-card';
import { CampusOperationHeader } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import { useCampusRoster } from '@/hooks/use-campus-roster';

export default function RosterImport({
    institution,
    rosters,
    preview,
}: RosterImportProps) {
    const {
        form,
        isCommitting,
        feedback,
        success,
        accessUnavailable,
        actions,
    } = useCampusRoster({
        institutionId: institution.id,
        initialSemester: preview?.semester ?? '',
        preview,
    });

    return (
        <>
            <Head title={`Roster Mahasiswa - ${institution.name} | SATU`} />

            <AppPage>
                <div className="space-y-6" data-test="campus-roster-root">
                    <CampusOperationHeader
                        theme="roster"
                        title="Roster mahasiswa"
                        description="Siapkan data mahasiswa untuk pencocokan afiliasi. Periksa pratinjau sebelum mengaktifkan roster baru."
                        institution={institution.name}
                        icon={FileSpreadsheet}
                    />

                    {feedback && (
                        <div
                            role="alert"
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm text-correction-subtle-foreground"
                        >
                            <p>{feedback}</p>
                            <Button
                                variant="outline"
                                disabled={isCommitting || form.processing}
                                onClick={actions.reloadRoster}
                            >
                                Muat ulang roster
                            </Button>
                        </div>
                    )}

                    {success && (
                        <p
                            role="status"
                            className="rounded-2xl border border-verified/30 bg-verified-subtle p-4 text-sm text-verified-subtle-foreground"
                        >
                            {success}
                        </p>
                    )}

                    {accessUnavailable ? (
                        <section className="rounded-3xl border border-border bg-white p-5">
                            <h2 className="text-lg font-bold">
                                Akses roster tidak tersedia
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Data sebelumnya disembunyikan. Periksa akses
                                Admin Universitas sebelum memuat ulang.
                            </p>
                        </section>
                    ) : (
                        <>
                            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                                <RosterUploadCard
                                    form={form}
                                    isCommitting={isCommitting}
                                    onSubmit={actions.submitPreview}
                                />
                                <RosterContextRail />
                            </div>

                            {preview && (
                                <div className="space-y-4">
                                    <RosterPreviewLedger preview={preview} />
                                    <RosterCommitActionBar
                                        preview={preview}
                                        isCommitting={isCommitting}
                                        isProcessing={form.processing}
                                        onCommit={actions.commitRoster}
                                    />
                                </div>
                            )}

                            <RosterHistoryTable rosters={rosters} />
                        </>
                    )}
                </div>
            </AppPage>
        </>
    );
}

RosterImport.layout = {
    breadcrumbs: [
        {
            title: 'Operasi Kampus',
            href: '#',
        },
        {
            title: 'Roster Mahasiswa',
            href: '#',
        },
    ],
};
