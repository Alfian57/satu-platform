import {
    createColumnHelper,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import { ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LeaderboardEntityCell } from '@/pages/leaderboards/_components/leaderboard-entity-cell';
import {
    formatNumber,
    formatScore,
} from '@/pages/leaderboards/_components/leaderboard-formatters';
import { LeaderboardMemberCell } from '@/pages/leaderboards/_components/leaderboard-member-cell';
import { LeaderboardMobileRow } from '@/pages/leaderboards/_components/leaderboard-mobile-row';
import { LeaderboardRankCell } from '@/pages/leaderboards/_components/leaderboard-rank-cell';
import { LeaderboardScoreCell } from '@/pages/leaderboards/_components/leaderboard-score-cell';
import type { LeaderboardRow } from '@/types';

const leaderboardFeatures = tableFeatures({});
const leaderboardColumnHelper = createColumnHelper<
    typeof leaderboardFeatures,
    LeaderboardRow
>();

export interface LeaderboardTableProps {
    rows: LeaderboardRow[];
    onExplain: (row: LeaderboardRow) => void;
}

export function LeaderboardTable({ rows, onExplain }: LeaderboardTableProps) {
    const isIndividual = rows[0]?.scopeType === 'individual';
    const entityLabel = isIndividual
        ? 'Mahasiswa'
        : rows[0]?.scopeType === 'team'
          ? 'Tim proyek'
          : 'Program studi';
    const columns = useMemo(
        () =>
            leaderboardColumnHelper.columns([
                leaderboardColumnHelper.display({
                    id: 'rank',
                    header: 'Peringkat',
                    cell: ({ row }) => (
                        <LeaderboardRankCell row={row.original} />
                    ),
                }),
                leaderboardColumnHelper.display({
                    id: 'entity',
                    header: entityLabel,
                    cell: ({ row }) => (
                        <LeaderboardEntityCell row={row.original} />
                    ),
                }),
                leaderboardColumnHelper.display({
                    id: 'score',
                    header: isIndividual ? 'Total XP' : 'Rata-rata XP',
                    cell: ({ row }) => (
                        <LeaderboardScoreCell row={row.original} />
                    ),
                }),
                leaderboardColumnHelper.display({
                    id: 'members',
                    header: 'Anggota aktif',
                    cell: ({ row }) => (
                        <LeaderboardMemberCell row={row.original} />
                    ),
                }),
                leaderboardColumnHelper.display({
                    id: 'action',
                    header: 'Penjelasan',
                    cell: ({ row }) => (
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 cursor-pointer border-border bg-card px-3 text-xs hover:border-primary/25 hover:bg-accent"
                            onClick={() => onExplain(row.original)}
                            data-test="leaderboard-explanation-trigger"
                        >
                            Penjelasan
                            <ArrowUpRight
                                aria-hidden="true"
                                className="size-3.5"
                            />
                        </Button>
                    ),
                }),
            ]),
        [onExplain, isIndividual, entityLabel],
    );
    const table = useTable({
        data: rows,
        columns,
        features: leaderboardFeatures,
        getRowId: (row) => row.scopeKey,
    });

    return (
        <div
            data-test="leaderboard-table"
            className="@container min-w-0 overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-md"
        >
            <div className="hidden @min-[42rem]:block">
                <table className="w-full table-fixed border-collapse text-left">
                    <caption className="sr-only">
                        Peringkat {entityLabel.toLocaleLowerCase('id-ID')}{' '}
                        berdasarkan {isIndividual ? 'total' : 'rata-rata'} XP
                        terverifikasi. Anggota aktif adalah pembagi skor. Skor
                        sama berbagi peringkat yang sama.
                    </caption>
                    <thead className="bg-accent/60">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        scope="col"
                                        className={cn(
                                            'border-b border-border px-4 py-4 text-xs leading-5 font-semibold text-muted-foreground',
                                            header.id === 'rank' && 'w-24',
                                            header.id === 'score' && 'w-28',
                                            header.id === 'members' && 'w-24',
                                            header.id === 'action' && 'w-36',
                                        )}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <table.FlexRender header={header} />
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                data-test="leaderboard-desktop-row"
                                data-scope-key={row.original.scopeKey}
                                className={cn(
                                    'border-b border-border/70 align-top last:border-b-0',
                                    row.original.suppressed &&
                                        'bg-pending-subtle/20',
                                )}
                            >
                                {row.getAllCells().map((cell) => {
                                    const content = (
                                        <table.FlexRender cell={cell} />
                                    );

                                    if (cell.column.id === 'entity') {
                                        return (
                                            <th
                                                key={cell.id}
                                                scope="row"
                                                className="min-w-0 px-4 py-5 text-left text-sm leading-6 font-normal [overflow-wrap:anywhere]"
                                            >
                                                {content}
                                            </th>
                                        );
                                    }

                                    return (
                                        <td
                                            key={cell.id}
                                            className="px-4 py-5 text-sm leading-6 [overflow-wrap:anywhere]"
                                        >
                                            {content}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid min-w-0 @min-[42rem]:hidden">
                {rows.map((row) => (
                    <LeaderboardMobileRow
                        key={row.scopeKey}
                        row={row}
                        isIndividual={isIndividual}
                        onExplain={onExplain}
                    />
                ))}
            </div>
        </div>
    );
}

export { formatNumber, formatScore };
