import {
    createColumnHelper,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LeaderboardRow } from '@/types';

const leaderboardFeatures = tableFeatures({});
const leaderboardColumnHelper = createColumnHelper<
    typeof leaderboardFeatures,
    LeaderboardRow
>();

type Props = {
    rows: LeaderboardRow[];
    onExplain: (row: LeaderboardRow) => void;
};

function formatNumber(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
}

function formatScore(value: string): string {
    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 4,
        minimumFractionDigits: 2,
    }).format(Number(value));
}

function RankCell({ row }: { row: LeaderboardRow }) {
    if (row.suppressed) {
        return (
            <span
                aria-label="Peringkat tidak dipublikasikan"
                className="font-label text-label text-muted-foreground"
            >
                -
            </span>
        );
    }

    return (
        <div className="grid gap-1">
            <span className="font-label text-label font-semibold tabular-nums">
                {row.rank}
            </span>
            {row.sharedRankGroup !== null && (
                <span className="text-xs text-muted-foreground">
                    Peringkat sama
                </span>
            )}
        </div>
    );
}

function EntityCell({ row }: { row: LeaderboardRow }) {
    return (
        <div className="grid min-w-0 gap-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate font-semibold">
                    {row.scopeLabel ?? 'Entitas tanpa nama'}
                </span>
                {row.suppressed ? (
                    <Badge
                        variant="outline"
                        className="gap-1 border-pending/30 bg-pending-subtle text-pending-subtle-foreground"
                    >
                        <ShieldAlert aria-hidden="true" className="size-3" />
                        Kohort dilindungi
                    </Badge>
                ) : (
                    <span className="inline-flex items-center gap-1 font-label text-label text-verified-subtle-foreground">
                        <CheckCircle2 aria-hidden="true" className="size-3.5" />
                        XP terverifikasi
                    </span>
                )}
            </div>
            {row.suppressed && (
                <span className="text-xs leading-5 text-muted-foreground">
                    {row.cohortSize} anggota aktif. Minimum publikasi 5.
                </span>
            )}
        </div>
    );
}

function ScoreCell({ row }: { row: LeaderboardRow }) {
    if (row.suppressed) {
        return <span className="text-muted-foreground">Tidak ditampilkan</span>;
    }

    return (
        <span className="font-label text-label font-semibold tabular-nums">
            {formatScore(row.score)} XP
        </span>
    );
}

function MemberCell({ row }: { row: LeaderboardRow }) {
    return (
        <span className="font-label text-label tabular-nums">
            {row.suppressed
                ? `${row.cohortSize} anggota`
                : `${row.activeMemberDenominator} anggota`}
        </span>
    );
}

export function LeaderboardTable({ rows, onExplain }: Props) {
    const columns = useMemo(
        () =>
            leaderboardColumnHelper.columns([
                leaderboardColumnHelper.display({
                    id: 'rank',
                    header: 'Peringkat',
                    cell: ({ row }) => <RankCell row={row.original} />,
                }),
                leaderboardColumnHelper.display({
                    id: 'entity',
                    header: 'Entitas',
                    cell: ({ row }) => <EntityCell row={row.original} />,
                }),
                leaderboardColumnHelper.display({
                    id: 'score',
                    header: 'Rata-rata XP',
                    cell: ({ row }) => <ScoreCell row={row.original} />,
                }),
                leaderboardColumnHelper.display({
                    id: 'members',
                    header: 'Denominator',
                    cell: ({ row }) => <MemberCell row={row.original} />,
                }),
                leaderboardColumnHelper.display({
                    id: 'action',
                    header: 'Penjelasan',
                    cell: ({ row }) => (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onExplain(row.original)}
                            data-test="leaderboard-explanation-trigger"
                        >
                            Lihat penjelasan
                        </Button>
                    ),
                }),
            ]),
        [onExplain],
    );
    const table = useTable({
        data: rows,
        columns,
        features: leaderboardFeatures,
        getRowId: (row) => row.scopeKey,
    });

    return (
        <div data-test="leaderboard-table">
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[48rem] border-collapse text-left">
                    <caption className="sr-only">
                        Peringkat leaderboard dengan rata-rata XP terverifikasi
                    </caption>
                    <thead className="bg-muted/60">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        scope="col"
                                        className={cn(
                                            'border-b border-border px-4 py-3 font-label text-label font-semibold text-muted-foreground',
                                            header.id === 'rank' && 'w-28',
                                            header.id === 'score' && 'w-36',
                                            header.id === 'members' && 'w-32',
                                            header.id === 'action' && 'w-40',
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
                                    'border-b border-border/80 align-top transition-colors duration-fast ease-ledger last:border-b-0 hover:bg-accent/40 motion-reduce:transition-none',
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
                                                className="px-4 py-4 text-left text-sm leading-6 font-normal"
                                            >
                                                {content}
                                            </th>
                                        );
                                    }

                                    return (
                                        <td
                                            key={cell.id}
                                            className="px-4 py-4 text-sm leading-6"
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

            <div className="grid gap-3 md:hidden">
                {rows.map((row) => (
                    <article
                        key={row.scopeKey}
                        data-test="leaderboard-mobile-row"
                        data-scope-key={row.scopeKey}
                        className={cn(
                            'grid gap-4 border-b border-border/80 px-1 py-4 last:border-b-0',
                            row.suppressed && 'bg-pending-subtle/20',
                        )}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-3">
                                <span className="grid size-9 shrink-0 place-items-center border border-border bg-muted/50 font-label text-label font-semibold tabular-nums">
                                    {row.suppressed ? '-' : row.rank}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="truncate font-semibold">
                                        {row.scopeLabel ?? 'Entitas tanpa nama'}
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {row.suppressed
                                            ? `${row.cohortSize} anggota aktif, kohort dilindungi`
                                            : row.sharedRankGroup !== null
                                              ? 'Peringkat sama'
                                              : 'Peringkat terpublikasi'}
                                    </p>
                                </div>
                            </div>
                            {row.suppressed ? (
                                <ShieldAlert
                                    aria-label="Kohort dilindungi"
                                    className="size-4 shrink-0 text-pending"
                                />
                            ) : (
                                <CheckCircle2
                                    aria-label="XP terverifikasi"
                                    className="size-4 shrink-0 text-verified"
                                />
                            )}
                        </div>

                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/70 pt-3 text-sm">
                            <div>
                                <dt className="font-label text-label text-muted-foreground">
                                    Rata-rata XP
                                </dt>
                                <dd className="mt-1 font-label text-label font-semibold tabular-nums">
                                    {row.suppressed
                                        ? 'Tidak ditampilkan'
                                        : `${formatScore(row.score)} XP`}
                                </dd>
                            </div>
                            <div>
                                <dt className="font-label text-label text-muted-foreground">
                                    Denominator
                                </dt>
                                <dd className="mt-1 font-label text-label font-semibold tabular-nums">
                                    {formatNumber(
                                        row.suppressed
                                            ? row.cohortSize
                                            : row.activeMemberDenominator,
                                    )}{' '}
                                    anggota
                                </dd>
                            </div>
                        </dl>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => onExplain(row)}
                            data-test="leaderboard-mobile-explanation-trigger"
                        >
                            Lihat penjelasan
                        </Button>
                    </article>
                ))}
            </div>
        </div>
    );
}

export { formatNumber, formatScore };
