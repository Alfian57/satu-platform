import { Head } from '@inertiajs/react';
import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppPage } from '@/layouts/_components/app-page';
import { CampusOperationHeader } from '@/pages/campus/_components/campus-operation-layout';
import { RosterCommitActionBar } from '@/pages/campus/roster-import/_components/roster-commit-action-bar';
import { RosterContextRail } from '@/pages/campus/roster-import/_components/roster-context-rail';
import { RosterHistoryTable } from '@/pages/campus/roster-import/_components/roster-history-table';
import { RosterPreviewLedger } from '@/pages/campus/roster-import/_components/roster-preview-ledger';
import { RosterUploadCard } from '@/pages/campus/roster-import/_components/roster-upload-card';
import { useCampusRoster } from '@/pages/campus/roster-import/_hooks/use-campus-roster';
import type { RosterImportProps } from '@/pages/campus/roster-import/_types/roster-types';

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
