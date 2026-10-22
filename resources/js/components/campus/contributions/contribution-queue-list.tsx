import { FileCheck2, RefreshCw } from 'lucide-react';
import { ContributionQueueAlerts } from '@/components/campus/contributions/contribution-queue-alerts';
import { ContributionQueueEmpty } from '@/components/campus/contributions/contribution-queue-empty';
import { ContributionQueueGuidance } from '@/components/campus/contributions/contribution-queue-guidance';
import { ContributionQueuePagination } from '@/components/campus/contributions/contribution-queue-pagination';
import { ContributionQueueRefreshState } from '@/components/campus/contributions/contribution-queue-refresh-state';
import { ContributionQueueRow } from '@/components/campus/contributions/contribution-queue-row';
import type {
    ContributionReviewQueueItem,
    ReviewFilters,
    ReviewQueue,
} from '@/components/campus/contributions/contribution-types';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface ContributionQueueListProps {
    reviewQueue: ReviewQueue;
    filters: ReviewFilters;
    selectedId: number | null;
    isLoading: boolean;
    isProcessing: boolean;
    actionMessage: string | null;
    actionError: string | null;
    queueError: string | null;
    onRefreshQueue: () => void;
    onSelectItem: (item: ContributionReviewQueueItem) => void;
    onUpdatePage: (page: number) => void;
}

export function ContributionQueueList({
    reviewQueue,
    filters,
    selectedId,
    isLoading,
    isProcessing,
    actionMessage,
    actionError,
    queueError,
    onRefreshQueue,
    onSelectItem,
    onUpdatePage,
}: ContributionQueueListProps) {
    return (
        <section
            aria-labelledby="contribution-review-queue-title"
            aria-busy={isLoading}
            className="@container min-w-0 space-y-4"
        >
            <ContributionQueueGuidance />

            <ContributionQueueAlerts
                actionMessage={actionMessage}
                actionError={actionError}
                queueError={queueError}
                isLoading={isLoading}
                onRefreshQueue={onRefreshQueue}
            />

            {/* Header bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white px-6 py-5 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <FileCheck2 className="size-4.5 text-primary" />
                        <h2
                            id="contribution-review-queue-title"
                            tabIndex={-1}
                            className="text-base font-bold text-foreground"
                        >
                            {filters.status === 'approved'
                                ? 'Hasil disetujui'
                                : 'Antrean validasi'}
                        </h2>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {reviewQueue.pagination.total} kontribusi sesuai filter
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 cursor-pointer rounded-xl text-xs font-semibold text-foreground hover:bg-accent/35 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    onClick={onRefreshQueue}
                    data-test="campus-contribution-refresh"
                >
                    {isLoading ? (
                        <Spinner className="mr-1.5 size-3.5" />
                    ) : (
                        <RefreshCw className="mr-1.5 size-3.5 text-muted-foreground" />
                    )}
                    Muat ulang
                </Button>
            </div>

            <div className="mt-4">
                {reviewQueue.items.length === 0 ? (
                    <ContributionQueueEmpty
                        searchQuery={filters.q}
                        statusFilter={filters.status}
                    />
                ) : (
                    <div className="grid gap-3">
                        {isLoading && <ContributionQueueRefreshState />}
                        {reviewQueue.items.map((item) => (
                            <ContributionQueueRow
                                key={item.id}
                                item={item}
                                isSelected={selectedId === item.id}
                                isProcessing={isProcessing}
                                onSelect={onSelectItem}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ContributionQueuePagination
                pagination={reviewQueue.pagination}
                isLoading={isLoading}
                onUpdatePage={onUpdatePage}
            />
        </section>
    );
}
