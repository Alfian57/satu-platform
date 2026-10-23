import {
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AffiliationDecisionPanel } from '@/pages/campus/affiliations/_components/affiliation-decision-panel';
import { AffiliationQueueRow } from '@/pages/campus/affiliations/_components/affiliation-queue-row';
import { AffiliationSummaryRail } from '@/pages/campus/affiliations/_components/affiliation-summary-rail';
import { useAffiliationReview } from '@/pages/campus/affiliations/_hooks/use-affiliation-review';
import type {
    CampusAffiliationsProps,
    Filters,
    ReviewQueue,
} from '@/pages/campus/affiliations/_types/affiliation-types';
import { DashboardArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';

interface AffiliationReviewRegionProps {
    institution: CampusAffiliationsProps['institution'];
    filters: Filters;
    reviewQueue: ReviewQueue;
    isQueueLoading: boolean;
    onQueueLoadingChange: (isLoading: boolean) => void;
    onRequestError: (forbidden: boolean) => void;
    onRequestSuccess: () => void;
    isForbidden: boolean;
}

export function AffiliationReviewRegion(props: AffiliationReviewRegionProps) {
    const { reviewQueue, isQueueLoading, isForbidden } = props;

    const {
        selected,
        isProcessing,
        isDisabled,
        decision,
        reasonCode,
        setReasonCode,
        note,
        setNote,
        fieldErrors,
        decisionHeadingRef,
        queueHeadingRef,
        changeDecision,
        updateFilters,
        refreshQueue,
        beginReview,
        abandonReview,
        submitDecision,
    } = useAffiliationReview(props);

    if (isForbidden) {
        return (
            <section className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                <ShieldCheck
                    aria-hidden="true"
                    className="size-7 text-primary"
                />
                <h2 className="mt-3 text-lg font-semibold">
                    Akses antrean tidak tersedia
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Data sebelumnya disembunyikan. Periksa kembali akses pada
                    kampus ini dengan memuat ulang.
                </p>
            </section>
        );
    }

    return (
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section
                aria-labelledby="queue-title"
                className="@container min-w-0 space-y-4"
                aria-busy={isQueueLoading}
            >
                <div className="flex flex-wrap items-start justify-between gap-3 px-1">
                    <div className="min-w-0">
                        <h2
                            id="queue-title"
                            ref={queueHeadingRef}
                            tabIndex={-1}
                            className="rounded-lg text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                        >
                            Antrean pemeriksaan
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {reviewQueue.pagination.total} berkas sesuai filter.
                            Periksa konteks sebelum memutuskan.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        disabled={isDisabled}
                        onClick={refreshQueue}
                    >
                        {isQueueLoading ? (
                            <Spinner aria-hidden="true" />
                        ) : (
                            <RefreshCw aria-hidden="true" className="size-4" />
                        )}{' '}
                        Muat ulang
                    </Button>
                </div>
                {isQueueLoading && (
                    <p
                        role="status"
                        className="text-xs leading-5 text-muted-foreground"
                    >
                        Memperbarui antrean. Berkas sebelumnya tetap
                        ditampilkan.
                    </p>
                )}
                {reviewQueue.items.length === 0 ? (
                    <div className="rounded-3xl border border-border bg-white px-5 py-8 text-center shadow-sm">
                        <DashboardArchiveArt className="mx-auto size-24" />
                        <h3 className="mt-3 text-lg font-semibold">
                            Tidak ada berkas pada filter ini
                        </h3>
                        <p className="mx-auto mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
                            Ubah filter atau muat ulang untuk memeriksa
                            permohonan yang baru masuk.
                        </p>
                    </div>
                ) : (
                    <div className="grid min-w-0 gap-3 @min-[64rem]:grid-cols-2">
                        {reviewQueue.items.map((item) => (
                            <AffiliationQueueRow
                                key={item.id}
                                item={item}
                                isSelected={selected?.id === item.id}
                                isDisabled={isDisabled}
                                isProcessing={isProcessing}
                                onBeginReview={beginReview}
                            />
                        ))}
                    </div>
                )}
                {(reviewQueue.pagination.lastPage > 1 ||
                    reviewQueue.pagination.currentPage > 1) && (
                    <nav
                        aria-label="Paginasi antrean afiliasi"
                        className="flex flex-wrap items-center justify-between gap-3 px-1"
                    >
                        <p className="text-xs leading-5 text-muted-foreground">
                            Halaman {reviewQueue.pagination.currentPage} dari{' '}
                            {reviewQueue.pagination.lastPage}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11"
                                disabled={
                                    isDisabled ||
                                    reviewQueue.pagination.currentPage <= 1
                                }
                                onClick={() =>
                                    updateFilters({
                                        page:
                                            reviewQueue.pagination.currentPage -
                                            1,
                                    })
                                }
                            >
                                <ChevronLeft
                                    aria-hidden="true"
                                    className="size-4"
                                />{' '}
                                Sebelumnya
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11"
                                disabled={
                                    isDisabled ||
                                    reviewQueue.pagination.currentPage >=
                                        reviewQueue.pagination.lastPage
                                }
                                onClick={() =>
                                    updateFilters({
                                        page:
                                            reviewQueue.pagination.currentPage +
                                            1,
                                    })
                                }
                            >
                                Berikutnya{' '}
                                <ChevronRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </Button>
                        </div>
                    </nav>
                )}
            </section>
            <aside
                aria-label="Tinjauan dan konteks antrean"
                className="min-w-0 space-y-4"
            >
                <AffiliationDecisionPanel
                    selected={selected}
                    decision={decision}
                    onChangeDecision={changeDecision}
                    reasonCode={reasonCode}
                    setReasonCode={setReasonCode}
                    note={note}
                    setNote={setNote}
                    fieldErrors={fieldErrors}
                    isDisabled={isDisabled}
                    isProcessing={isProcessing}
                    decisionHeadingRef={decisionHeadingRef}
                    onSubmit={submitDecision}
                    onAbandon={abandonReview}
                />
                <AffiliationSummaryRail reviewQueue={reviewQueue} />
            </aside>
        </div>
    );
}
