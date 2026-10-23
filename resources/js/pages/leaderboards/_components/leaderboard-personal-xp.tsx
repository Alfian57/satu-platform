import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/pages/leaderboards/_components/leaderboard-formatters';
import { index as contributionsIndex } from '@/routes/contributions';

export interface LeaderboardPersonalXpProps {
    personalXp: number | null;
    pendingXpCount?: number | null;
    semester: string | null;
}

export function LeaderboardPersonalXp({
    personalXp,
    pendingXpCount,
    semester,
}: LeaderboardPersonalXpProps) {
    if (personalXp === null) {
        return null;
    }

    return (
        <section
            aria-labelledby="leaderboard-personal-xp-title"
            className="grid min-w-0 gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
            data-test="leaderboard-personal-xp"
        >
            <h2
                id="leaderboard-personal-xp-title"
                className="text-base font-semibold"
            >
                XP kontribusimu
            </h2>
            <p className="font-mono text-3xl font-semibold text-primary">
                {formatNumber(personalXp)} <span className="text-sm">XP</span>
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
                {semester || 'Semester belum tersedia'}. Dari kontribusi yang
                disetujui, setelah pengurangan pembatalan XP. Bukan nilai
                akademik atau ukuran seluruh kemampuanmu.
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
                Ringkasan ini hanya untukmu. Tidak mengaktifkan peringkat
                individual atau publikasi portofolio.
            </p>
            {(pendingXpCount ?? 0) > 0 && (
                <p
                    role="status"
                    className="rounded-xl border border-satu-orange-border bg-satu-orange-soft p-3 text-xs leading-5 text-satu-orange-ink"
                    data-test="leaderboard-xp-pending"
                >
                    Ada {formatNumber(pendingXpCount ?? 0)} kontribusi yang
                    disetujui tetapi XP-nya belum tercatat. Sistem akan
                    memeriksa kembali data semester. Jumlah ini mencakup seluruh
                    semester, bukan hanya pilihan di atas. Kontribusi tidak
                    perlu diajukan ulang. Jika tetap belum tercatat, hubungi
                    Admin Universitas untuk memeriksa roster.
                </p>
            )}
            <Button asChild variant="outline" className="min-h-11 w-full">
                <Link href={contributionsIndex()}>Lihat kontribusi saya</Link>
            </Button>
        </section>
    );
}
