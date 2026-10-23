import { formatScore } from '@/pages/leaderboards/_components/leaderboard-formatters';
import type { LeaderboardRow } from '@/types';

export function LeaderboardScoreCell({ row }: { row: LeaderboardRow }) {
    if (row.suppressed) {
        return <span className="text-muted-foreground">Tidak ditampilkan</span>;
    }

    return (
        <span className="font-label text-sm leading-6 font-semibold [overflow-wrap:anywhere] text-primary tabular-nums">
            {formatScore(row.score)} XP
        </span>
    );
}
