import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LeaderboardRow } from '@/types';

export function LeaderboardEntityCell({ row }: { row: LeaderboardRow }) {
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
