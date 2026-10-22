import { Head } from '@inertiajs/react';
import { CheckCircle2, Network, Shield } from 'lucide-react';
import { AppPage } from '@/components/app-page';
import { InclusionDetailPanel } from '@/components/campus/inclusion/inclusion-detail-panel';
import { InclusionFilterBar } from '@/components/campus/inclusion/inclusion-filter-bar';
import { InclusionInactiveState } from '@/components/campus/inclusion/inclusion-inactive-state';
import { InclusionQueueList } from '@/components/campus/inclusion/inclusion-queue-list';
import type { CampusInclusionProps } from '@/components/campus/inclusion/inclusion-types';
import { CampusOperationHeader } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import { useCampusInclusion } from '@/hooks/use-campus-inclusion';

export default function CampusInclusion({
    institution,
    engineActive,
    signals,
    filters,
    selectedSignal,
}: CampusInclusionProps) {
    const {
        period,
        setPeriod,
        restrictedOnly,
        setRestrictedOnly,
        isPending,
        feedback,
        success,
        accessUnavailable,
        form,
        busy,
        available,
        visit,
        submitReview,
    } = useCampusInclusion({
        institution,
        engineActive,
        filters,
        selectedSignal,
    });

    return (
        <>
            <Head title={`Peninjauan Inklusi - ${institution.name} | SATU`} />
            <AppPage>
                <div className="space-y-6" data-test="campus-inclusion-root">
                    <CampusOperationHeader
                        theme="inclusion"
                        title="Peninjauan inklusi"
                        description="Tinjau kesempatan kolaborasi dengan konteks yang memadai. Catat kesimpulan manusia, bukan diagnosis atau penilaian pribadi."
                        institution={institution.name}
                        icon={Network}
                        eyebrow="Peninjauan terbatas"
                    />
                    <div className="flex items-start gap-3 rounded-2xl border border-pending/30 bg-pending-subtle p-4 text-sm leading-6 text-pending-subtle-foreground">
                        <Shield
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                        <p>
                            Hanya peninjau kampus berotorisasi. Sinyal dan
                            catatan ini tidak ditampilkan kepada mahasiswa,
                            rekan tim, atau publik.
                        </p>
                    </div>
                    {feedback && (
                        <div
                            role="alert"
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm text-correction-subtle-foreground"
                        >
                            <p>{feedback}</p>
                            <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() => visit()}
                            >
                                Muat ulang
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
                    {!available ? (
                        <InclusionInactiveState
                            accessUnavailable={accessUnavailable}
                        />
                    ) : (
                        <>
                            <InclusionFilterBar
                                period={period}
                                setPeriod={setPeriod}
                                restrictedOnly={restrictedOnly}
                                setRestrictedOnly={setRestrictedOnly}
                                busy={busy}
                                onSubmit={() => visit()}
                            />
                            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
                                <InclusionQueueList
                                    signals={signals}
                                    selectedSignalId={selectedSignal?.id}
                                    isPending={isPending}
                                    busy={busy}
                                    onSelectSignal={(id) => visit(id)}
                                    onPageChange={(page) =>
                                        visit(undefined, page)
                                    }
                                />
                                <InclusionDetailPanel
                                    selectedSignal={selectedSignal}
                                    form={form}
                                    busy={busy}
                                    onSubmitReview={submitReview}
                                />
                            </div>
                        </>
                    )}
                </div>
            </AppPage>
        </>
    );
}

CampusInclusion.layout = {
    breadcrumbs: [
        { title: 'Operasi Kampus', href: '#' },
        { title: 'Peninjauan Inklusi', href: '#' },
    ],
};
