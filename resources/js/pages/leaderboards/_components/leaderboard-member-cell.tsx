import { formatNumber } from '@/pages/leaderboards/_components/leaderboard-formatters';
import type { LeaderboardRow } from '@/types';

export function LeaderboardMemberCell({ row }: { row: LeaderboardRow }) {
    return (
        <span className="font-label text-label tabular-nums">
            {row.suppressed
                ? `${formatNumber(row.cohortSize)} anggota`
                : `${formatNumber(row.activeMemberDenominator)} anggota`}
        </span>
    );
}
