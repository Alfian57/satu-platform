import {
    BookOpenCheck,
    CalendarClock,
    Equal,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { formatLeaderboardDate } from '@/pages/leaderboards/_components/leaderboard-formatters';
import type { LeaderboardPageData } from '@/types/leaderboard';

export interface LeaderboardMethodGuideProps {
    individual: boolean;
    period: LeaderboardPageData['period'];
}

export function LeaderboardMethodGuide({
    individual,
    period,
}: LeaderboardMethodGuideProps) {
    return (
        <section
            id="leaderboard-method"
            aria-labelledby="leaderboard-method-title"
            className="grid min-w-0 scroll-mt-24 gap-5 border-t border-border px-1 pt-5"
        >
            <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                    <BookOpenCheck aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary">
                        Baca dengan konteks
                    </p>
                    <h2
                        id="leaderboard-method-title"
                        className="mt-1 text-title font-bold tracking-tight"
                    >
                        Cara menghitung
                    </h2>
                </div>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-linear-to-br from-card to-accent/60 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                    {individual
                        ? 'Skor individual'
                        : 'Skor program studi dan tim'}
                </p>
                <p className="mt-2 text-base leading-7 font-semibold">
                    {individual
                        ? 'Total XP terverifikasi dalam semester yang dipilih.'
                        : 'Total XP terverifikasi dibagi jumlah anggota aktif.'}
                </p>
            </div>
            <ul className="grid gap-4 text-sm leading-6 text-muted-foreground">
                <li className="flex items-start gap-3">
                    <ShieldCheck
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                    />
                    <span>
                        XP hanya berasal dari kontribusi yang disetujui kampus.
                    </span>
                </li>
                <li className="flex items-start gap-3">
                    <Users
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                    />
                    <span>
                        {individual
                            ? 'Individual tidak memakai ambang kelompok lima anggota. Persetujuan tetap diperlukan.'
                            : 'Minimum lima anggota aktif untuk publikasi kelompok. Skor kelompok kecil tidak ditampilkan.'}
                    </span>
                </li>
                <li className="flex items-start gap-3">
                    <Equal
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                    />
                    <span>
                        Skor sama berbagi peringkat yang sama. Nomor berikutnya
                        dapat melompat.
                    </span>
                </li>
            </ul>
            {!individual && (
                <details className="min-w-0 rounded-xl border border-border bg-card p-3">
                    <summary className="min-h-11 cursor-pointer rounded-lg py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                        Siapa anggota aktif?
                    </summary>
                    <p className="pt-2 text-xs leading-6 text-muted-foreground">
                        Anggota dengan afiliasi terverifikasi, tercatat aktif
                        pada roster semester, dan memiliki kontribusi yang
                        disetujui pada semester tersebut. Jumlah ini menjadi
                        pembagi skor, bukan seluruh mahasiswa kampus.
                    </p>
                </details>
            )}
            <div className="grid min-w-0 gap-2 border-t border-border pt-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <CalendarClock
                        aria-hidden="true"
                        className="size-4 shrink-0 text-primary"
                    />
                    Waktu perhitungan
                </h3>
                <p className="text-xs leading-6 [overflow-wrap:anywhere] text-muted-foreground">
                    {formatLeaderboardDate(period?.computedAt ?? null)}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                    {period?.isStale
                        ? 'Snapshot perlu dihitung ulang. Memuat ulang halaman tidak menjalankan perhitungan.'
                        : period
                          ? 'Angka mengikuti snapshot server, bukan pembaruan langsung.'
                          : 'Belum ada snapshot untuk semester ini.'}
                </p>
                <p className="font-label text-label text-xs [overflow-wrap:anywhere] text-muted-foreground">
                    Versi aturan: {period?.ruleVersion ?? 'belum tersedia'}
                </p>
            </div>
        </section>
    );
}
