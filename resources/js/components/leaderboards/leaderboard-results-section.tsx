import { Deferred } from '@inertiajs/react';
import { LeaderboardEmptyState } from '@/components/leaderboards/leaderboard-empty-state';
import { LeaderboardLoading } from '@/components/leaderboards/leaderboard-loading';
import { LeaderboardNotice } from '@/components/leaderboards/leaderboard-notice';
import { LeaderboardPagination } from '@/components/leaderboards/leaderboard-pagination';
import { LeaderboardTable } from '@/components/leaderboards/leaderboard-table';
import { Button } from '@/components/ui/button';
import type {
    LeaderboardRow,
    LeaderboardRowsRegion,
} from '@/types/leaderboard';

export interface LeaderboardResultsSectionProps {
    categoryLabel: string;
    isNavigating: boolean;
    rows?: LeaderboardRowsRegion;
    busy: boolean;
    onExplain: (row: LeaderboardRow) => void;
    onPageChange: (page: number) => void;
    onOpenPreference: () => void;
    onRetry?: () => void;
}

export function LeaderboardResultsSection({
    categoryLabel,
    isNavigating,
    rows,
    busy,
    onExplain,
    onPageChange,
    onOpenPreference,
    onRetry,
}: LeaderboardResultsSectionProps) {
    const hasRows = rows?.state === 'ready' && rows.rows.length > 0;

    return (
        <section
            aria-labelledby="leaderboard-results-title"
            className="grid min-w-0 content-start gap-4"
        >
            <h2 id="leaderboard-results-title" className="sr-only">
                Hasil peringkat {categoryLabel}
            </h2>

            <Deferred
                data="leaderboardRows"
                fallback={<LeaderboardLoading refreshing={false} />}
                rescue={({ reloading }) => (
                    <LeaderboardNotice
                        tone="error"
                        title="Hasil belum dapat dimuat"
                    >
                        <p>Data tersimpan tetap aman. Coba muat ulang.</p>
                        <Button
                            variant="outline"
                            className="mt-3 min-h-11"
                            disabled={reloading || busy}
                            onClick={onRetry}
                            data-test="leaderboard-deferred-retry"
                        >
                            Muat ulang hasil
                        </Button>
                    </LeaderboardNotice>
                )}
            >
                {isNavigating && <LeaderboardLoading refreshing={true} />}
                {hasRows ? (
                    <div className="grid min-w-0 gap-4">
                        <LeaderboardTable
                            rows={rows.rows}
                            onExplain={onExplain}
                        />
                        {rows.pagination && (
                            <LeaderboardPagination
                                page={rows.pagination.currentPage}
                                totalPages={rows.pagination.lastPage}
                                busy={busy}
                                onPageChange={onPageChange}
                            />
                        )}
                    </div>
                ) : (
                    <LeaderboardEmptyState
                        reason={rows?.emptyReason}
                        onOpenPreference={onOpenPreference}
                    />
                )}
            </Deferred>
        </section>
    );
}
