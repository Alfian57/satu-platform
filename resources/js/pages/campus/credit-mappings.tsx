import { Head } from '@inertiajs/react';
import { Award, CheckCircle2 } from 'lucide-react';
import { AppPage } from '@/components/app-page';
import { CreditConfirmationDialog } from '@/components/campus/credits/credit-confirmation-dialog';
import { CreditDraftForm } from '@/components/campus/credits/credit-draft-form';
import { CreditMappingList } from '@/components/campus/credits/credit-mapping-list';
import type { CampusCreditMappingsProps } from '@/components/campus/credits/credit-types';
import {
    CampusOperationHeader,
    CampusWorkflowGuide,
} from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import { useCampusCreditMappings } from '@/hooks/use-campus-credit-mappings';

export default function CampusCreditMappings({
    mappings,
    institution,
}: CampusCreditMappingsProps) {
    const {
        form,
        confirmation,
        processing,
        feedback,
        success,
        accessUnavailable,
        busy,
        activeCount,
        draftCount,
        actions,
    } = useCampusCreditMappings({
        institutionId: institution.id,
        mappings,
    });

    return (
        <>
            <Head title={`Pemetaan Kredit - ${institution.name} | SATU`} />
            <AppPage>
                <div
                    className="space-y-6"
                    data-test="campus-credit-mappings-root"
                >
                    <CampusOperationHeader
                        theme="credits"
                        title="Pemetaan kredit"
                        description="Atur kredit akademik untuk jenis aktivitas melalui aturan berversi. Draft belum berlaku sampai diaktifkan."
                        institution={institution.name}
                        icon={Award}
                    />

                    {feedback && (
                        <div
                            role="alert"
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm text-correction-subtle-foreground"
                        >
                            <p>{feedback}</p>
                            <Button
                                variant="outline"
                                disabled={busy}
                                onClick={actions.reloadMappings}
                            >
                                Muat ulang aturan
                            </Button>
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

                    {accessUnavailable ? (
                        <section className="rounded-3xl border border-border bg-white p-5">
                            <h2 className="text-lg font-bold">
                                Akses pemetaan kredit tidak tersedia
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Data sebelumnya disembunyikan. Periksa izin
                                institusi sebelum memuat ulang.
                            </p>
                        </section>
                    ) : (
                        <>
                            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                                <CreditDraftForm
                                    form={form}
                                    busy={busy}
                                    onSubmit={actions.createDraft}
                                />
                                <CampusWorkflowGuide
                                    title="Memahami versi aturan"
                                    steps={[
                                        {
                                            title: 'Draft belum berlaku',
                                            description:
                                                'Periksa aktivitas dan SKS sebelum mengaktifkan aturan.',
                                        },
                                        {
                                            title: 'Aktif untuk aktivitas yang sama',
                                            description:
                                                'Aktivasi menggantikan aturan aktif sebelumnya, tanpa menghapus riwayat.',
                                        },
                                        {
                                            title: 'Riwayat tetap tersimpan',
                                            description:
                                                'Aturan yang dihentikan tidak menulis ulang versi pada sinkronisasi historis.',
                                        },
                                    ]}
                                />
                            </div>

                            <CreditMappingList
                                mappings={mappings}
                                activeCount={activeCount}
                                draftCount={draftCount}
                                busy={busy}
                                onAction={actions.openConfirmation}
                            />
                        </>
                    )}
                </div>
            </AppPage>

            <CreditConfirmationDialog
                confirmation={confirmation}
                busy={busy}
                processing={processing}
                feedback={feedback}
                onClose={actions.closeConfirmation}
                onConfirm={actions.confirmAction}
            />
        </>
    );
}

CampusCreditMappings.layout = {
    breadcrumbs: [
        { title: 'Operasi Kampus', href: '#' },
        { title: 'Pemetaan Kredit', href: '#' },
    ],
};
