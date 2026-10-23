import { Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatLeaderboardDate } from '@/pages/leaderboards/_components/leaderboard-formatters';
import type { LeaderboardPageData } from '@/types/leaderboard';

export interface LeaderboardBadgeListProps {
    badges: LeaderboardPageData['badges'];
}

export function LeaderboardBadgeList({ badges }: LeaderboardBadgeListProps) {
    return (
        <section
            aria-labelledby="leaderboard-badge-title"
            className="grid min-w-0 gap-4 border-t border-border px-1 pt-5"
        >
            <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                    <Award aria-hidden="true" className="size-5" />
                </span>
                <div>
                    <p className="text-xs font-semibold text-primary">
                        Pengakuan kontribusi
                    </p>
                    <h2
                        id="leaderboard-badge-title"
                        className="mt-1 text-title font-bold tracking-tight"
                    >
                        Badge terverifikasi
                    </h2>
                </div>
            </div>
            {badges.length > 0 ? (
                <ul className="grid gap-3" data-test="leaderboard-badge-list">
                    {badges.map((badge) => (
                        <li
                            key={badge.id}
                            className="grid min-w-0 gap-2 border-t border-border py-4 [overflow-wrap:anywhere]"
                        >
                            <div className="flex min-w-0 items-start justify-between gap-2">
                                <h3 className="min-w-0 text-base leading-6 font-semibold">
                                    {badge.name}
                                </h3>
                                <Badge variant="outline" className="shrink-0">
                                    Level {badge.level}
                                </Badge>
                            </div>
                            <p className="text-xs leading-5 text-muted-foreground">
                                {badge.description}
                            </p>
                            <p className="text-xs leading-5 text-muted-foreground">
                                {badge.sourceLabel}
                                {badge.sourceVersion !== null &&
                                    `, versi ${badge.sourceVersion}`}
                            </p>
                            <p className="text-xs leading-5 text-muted-foreground">
                                Diberikan{' '}
                                {formatLeaderboardDate(badge.awardedAt)}. Aturan
                                v{badge.ruleVersion}.
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="rounded-2xl border border-dashed border-border p-4">
                    <p className="text-sm font-medium">
                        Belum ada badge tersedia.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Badge muncul sesuai aturan dan sumber kontribusi
                        terverifikasi. Tidak memengaruhi skor peringkat.
                    </p>
                </div>
            )}
            {badges.length > 0 && (
                <p className="text-xs leading-5 text-muted-foreground">
                    Badge tidak menambah skor peringkat.
                </p>
            )}
        </section>
    );
}
