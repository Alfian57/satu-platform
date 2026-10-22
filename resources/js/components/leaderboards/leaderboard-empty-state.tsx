import { ArrowRight, LockKeyhole, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LeaderboardEmptyStateProps {
    reason?: string;
    message?: string;
    onOpenPreference: () => void;
}

export function LeaderboardEmptyState({
    reason,
    message,
    onOpenPreference,
}: LeaderboardEmptyStateProps) {
    if (reason === 'opt_in_required') {
        return (
            <div
                className="grid min-w-0 justify-items-center gap-4 rounded-3xl border border-dashed border-primary/30 bg-card p-8 text-center sm:p-12"
                data-test="leaderboard-opt-in-preview"
            >
                <span className="grid size-12 place-items-center rounded-2xl bg-accent text-primary">
                    <LockKeyhole aria-hidden="true" className="size-6" />
                </span>
                <div className="grid gap-2">
                    <h3 className="text-xl leading-snug font-bold tracking-tight text-foreground sm:text-2xl">
                        Peringkat individual membutuhkan persetujuanmu.
                    </h3>
                    <p className="max-w-prose text-sm leading-6 text-muted-foreground">
                        Namamu hanya akan terlihat oleh sesama mahasiswa yang
                        juga mengaktifkan peringkat individual di kampus ini.
                        Kamu dapat mengubah pilihan kapan saja.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        type="button"
                        onClick={onOpenPreference}
                        data-test="leaderboard-opt-in-open"
                    >
                        Atur persetujuan
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="grid min-w-0 justify-items-center gap-3 rounded-3xl border border-dashed border-border bg-card p-8 text-center sm:p-12"
            data-test="leaderboard-empty"
        >
            <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <UserRound aria-hidden="true" className="size-6" />
            </span>
            <div className="grid gap-2">
                <h3 className="text-lg leading-snug font-bold tracking-tight text-foreground sm:text-xl">
                    Belum ada data peringkat untuk pilihan ini.
                </h3>
                <p className="max-w-prose text-sm leading-6 text-muted-foreground">
                    {message ??
                        'Coba pilih semester atau kategori lain, atau periksa kembali setelah perhitungan server selesai.'}
                </p>
            </div>
        </div>
    );
}
