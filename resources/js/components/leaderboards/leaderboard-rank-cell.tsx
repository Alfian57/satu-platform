import type { LeaderboardRow } from '@/types';

export function LeaderboardRankCell({ row }: { row: LeaderboardRow }) {
    if (row.suppressed) {
        return (
            <span
                aria-label="Peringkat tidak dipublikasikan"
                className="grid size-12 place-items-center rounded-2xl border border-border bg-muted font-label text-sm text-muted-foreground"
            >
                -
            </span>
        );
    }

    return (
        <div className="grid gap-1">
            <span className="grid size-12 place-items-center rounded-2xl border border-primary/10 bg-accent font-label text-sm font-semibold text-primary tabular-nums">
                {row.rank ?? '-'}
            </span>
            {row.sharedRankGroup !== null && (
                <span className="text-xs text-muted-foreground">
                    Peringkat sama
                </span>
            )}
        </div>
    );
}
