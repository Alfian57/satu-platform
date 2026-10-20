import {
    createColumnHelper,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import { ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';
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

function formatNumber(value: number | null): string {
    return value === null ? '-' : new Intl.NumberFormat('id-ID').format(value);
}

function formatScore(value: string | null): string {
    if (value === null) {
        return '-';
    }

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

function EntityCell({ row }: { row: LeaderboardRow }) {
    return (
        <div className="grid min-w-0 gap-2 [overflow-wrap:anywhere]">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="min-w-0 text-base leading-6 font-bold tracking-tight text-foreground">
                    {row.scopeLabel ?? 'Entitas tanpa nama'}
                </span>
                {row.suppressed ? (
                    <Badge
                        variant="outline"
                        className="gap-1 border-pending/30 bg-pending-subtle text-pending-subtle-foreground"
                    >
                        <ShieldAlert aria-hidden="true" className="size-3" />
                        Kelompok dilindungi
                    </Badge>
                ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-verified-subtle-foreground">
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
        <span className="font-label text-sm leading-6 font-semibold [overflow-wrap:anywhere] text-primary tabular-nums">
            {formatScore(row.score)} XP
        </span>
    );
}

function MemberCell({ row }: { row: LeaderboardRow }) {
    return (
        <span className="font-label text-label tabular-nums">
            {row.suppressed
                ? `${formatNumber(row.cohortSize)} anggota`
                : `${formatNumber(row.activeMemberDenominator)} anggota`}
        </span>
    );
}

export function LeaderboardTable({ rows, onExplain }: Props) {
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
                    cell: ({ row }) => <RankCell row={row.original} />,
                }),
                leaderboardColumnHelper.display({
                    id: 'entity',
                    header: entityLabel,
                    cell: ({ row }) => <EntityCell row={row.original} />,
                }),
                leaderboardColumnHelper.display({
                    id: 'score',
                    header: isIndividual ? 'Total XP' : 'Rata-rata XP',
                    cell: ({ row }) => <ScoreCell row={row.original} />,
                }),
                leaderboardColumnHelper.display({
                    id: 'members',
                    header: 'Anggota aktif',
                    cell: ({ row }) => <MemberCell row={row.original} />,
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
                    <article
                        key={row.scopeKey}
                        data-test="leaderboard-mobile-row"
                        data-scope-key={row.scopeKey}
                        className={cn(
                            'grid min-w-0 gap-4 border-b border-border/70 p-5 last:border-b-0 sm:p-6',
                            row.suppressed && 'bg-pending-subtle/20',
                        )}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-3">
                                <span
                                    aria-label={
                                        row.suppressed
                                            ? 'Peringkat tidak dipublikasikan'
                                            : `Peringkat ${row.rank ?? 'belum tersedia'}`
                                    }
                                    className={cn(
                                        'grid size-12 shrink-0 place-items-center rounded-2xl border font-label text-sm font-semibold tabular-nums',
                                        row.suppressed
                                            ? 'border-border bg-muted text-muted-foreground'
                                            : 'border-primary/10 bg-accent text-primary',
                                    )}
                                >
                                    {row.suppressed ? '-' : (row.rank ?? '-')}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-base leading-6 font-bold tracking-tight [overflow-wrap:anywhere] text-foreground sm:text-lg">
                                        {row.scopeLabel ?? 'Entitas tanpa nama'}
                                    </h3>
                                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                        {row.suppressed
                                            ? `${formatNumber(row.cohortSize)} anggota aktif, kelompok dilindungi`
                                            : row.sharedRankGroup !== null
                                              ? 'Peringkat sama'
                                              : 'XP terverifikasi'}
                                    </p>
                                </div>
                            </div>
                            {row.suppressed ? (
                                <ShieldAlert
                                    aria-label="Kelompok dilindungi"
                                    className="size-4 shrink-0 text-pending"
                                />
                            ) : (
                                <CheckCircle2
                                    aria-label="XP terverifikasi"
                                    className="size-4 shrink-0 text-verified"
                                />
                            )}
                        </div>

                        <dl className="grid min-w-0 grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                            <div className="min-w-0">
                                <dt className="text-xs leading-5 text-muted-foreground">
                                    {isIndividual ? 'Total XP' : 'Rata-rata XP'}
                                </dt>
                                <dd
                                    className={cn(
                                        'mt-2 font-label text-sm leading-6 font-semibold [overflow-wrap:anywhere] tabular-nums',
                                        row.suppressed
                                            ? 'text-muted-foreground'
                                            : 'text-primary',
                                    )}
                                >
                                    {row.suppressed
                                        ? 'Tidak ditampilkan'
                                        : `${formatScore(row.score)} XP`}
                                </dd>
                            </div>
                            <div className="min-w-0">
                                <dt className="text-xs leading-5 text-muted-foreground">
                                    Anggota aktif
                                </dt>
                                <dd className="mt-2 font-label text-label font-semibold [overflow-wrap:anywhere] tabular-nums">
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
                            className="min-h-11 w-full cursor-pointer border-border bg-card hover:border-primary/25 hover:bg-accent"
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
