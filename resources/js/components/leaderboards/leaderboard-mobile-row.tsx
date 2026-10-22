import { CheckCircle2, ShieldAlert } from 'lucide-react';
import {
    formatNumber,
    formatScore,
} from '@/components/leaderboards/leaderboard-formatters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LeaderboardRow } from '@/types';

export interface LeaderboardMobileRowProps {
    row: LeaderboardRow;
    isIndividual: boolean;
    onExplain: (row: LeaderboardRow) => void;
}

export function LeaderboardMobileRow({
    row,
    isIndividual,
    onExplain,
}: LeaderboardMobileRowProps) {
    return (
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
    );
}
