import type { RefObject } from 'react';
import { ContributionDetailPanel } from '@/components/campus/contributions/contribution-detail-panel';
import { ContributionQueueList } from '@/components/campus/contributions/contribution-queue-list';
import type {
    CampusContributionsProps,
    ReviewFilters,
    ReviewQueue,
} from '@/components/campus/contributions/contribution-types';
import { Button } from '@/components/ui/button';
import { useContributionReview } from '@/hooks/use-contribution-review';

interface ContributionReviewWorkspaceProps {
    institution: CampusContributionsProps['institution'];
    filters: ReviewFilters;
    reviewQueue: ReviewQueue;
    isFilterLoading: boolean;
    onAccessUnavailable: () => void;
    filterChangeGuardRef: RefObject<(() => boolean) | null>;
}

export function ContributionReviewWorkspace(
    props: ContributionReviewWorkspaceProps,
) {
    const { reviewQueue, filters } = props;

    const {
        selectedId,
        selected,
        isLoading,
        isProcessing,
        actionMessage,
        actionError,
        queueError,
        accessUnavailable,
        stale,
        blocked,
        needsCheck,
        commandBlocked,
        selectedDecision,
        reason,
        note,
        statusError,
        decisionError,
        reasonError,
        noteError,
        selectItem,
        updatePage,
        refreshQueue,
        submitReview,
        useLatest,
        closeDocket,
        handleDecisionChange,
        handleReasonChange,
        handleNoteChange,
    } = useContributionReview(props);

    if (accessUnavailable) {
        return (
            <section className="rounded-3xl border border-border bg-white p-5">
                <h2 className="text-lg font-bold">
                    Akses validasi tidak tersedia
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Berkas sebelumnya disembunyikan. Periksa izin kampus sebelum
                    memuat ulang.
                </p>
                <Button
                    variant="outline"
                    disabled={isLoading}
                    onClick={refreshQueue}
                    className="mt-4"
                >
                    Muat ulang antrean
                </Button>
            </section>
        );
    }

    return (
        <div className="space-y-6 motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none">
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
                <ContributionQueueList
                    reviewQueue={reviewQueue}
                    filters={filters}
                    selectedId={selectedId}
                    isLoading={isLoading}
                    isProcessing={isProcessing}
                    actionMessage={actionMessage}
                    actionError={actionError}
                    queueError={queueError}
                    onRefreshQueue={refreshQueue}
                    onSelectItem={selectItem}
                    onUpdatePage={updatePage}
                />
                <ContributionDetailPanel
                    selected={selected}
                    stale={stale}
                    commandBlocked={commandBlocked}
                    needsCheck={needsCheck}
                    isLoading={isLoading}
                    isProcessing={isProcessing}
                    statusError={statusError}
                    decisionError={decisionError}
                    reasonError={reasonError}
                    noteError={noteError}
                    blocked={blocked}
                    selectedDecision={selectedDecision}
                    onDecisionChange={handleDecisionChange}
                    reason={reason}
                    onReasonChange={handleReasonChange}
                    note={note}
                    onNoteChange={handleNoteChange}
                    onRefreshQueue={refreshQueue}
                    onUseLatest={useLatest}
                    onSubmit={submitReview}
                    onClose={closeDocket}
                />
            </div>
        </div>
    );
}
