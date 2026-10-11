import {
    Award,
    BookOpenCheck,
    CalendarClock,
    CircleAlert,
    Equal,
    Info,
    LockKeyhole,
    ShieldCheck,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LeaderboardPageData } from '@/types/leaderboard';

export function formatLeaderboardDate(value: string | null): string {
    if (!value) {
        return 'Belum dihitung';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Waktu tidak tersedia';
    }

    return (
        new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'UTC',
        }).format(date) + ' UTC'
    );
}

export function LeaderboardNotice({
    tone = 'info',
    title,
    children,
}: {
    tone?: 'info' | 'warning' | 'error';
    title: string;
    children: ReactNode;
}) {
    const Icon =
        tone === 'error'
            ? CircleAlert
            : tone === 'warning'
              ? Info
              : ShieldCheck;

    return (
        <div
            role={tone === 'error' ? 'alert' : 'status'}
            data-test={`leaderboard-notice-${tone}`}
            className={cn(
                'flex min-w-0 items-start gap-3 rounded-2xl border p-4 text-sm leading-6',
                tone === 'error'
                    ? 'border-correction/30 bg-correction-subtle text-correction-subtle-foreground'
                    : tone === 'warning'
                      ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                      : 'border-border bg-accent/60 text-foreground',
            )}
        >
            <Icon aria-hidden="true" className="mt-1 size-4 shrink-0" />
            <div className="min-w-0 [overflow-wrap:anywhere]">
                <p className="font-semibold">{title}</p>
                <div className="mt-1">{children}</div>
            </div>
        </div>
    );
}

export function LeaderboardContext({
    data,
    pending,
    savingPreference,
    onPreference,
}: {
    data: LeaderboardPageData;
    pending: boolean;
    savingPreference: boolean;
    onPreference: () => void;
}) {
    const individual = data.scope === 'individual';

    return (
        <aside
            aria-label="Panduan dan pengaturan peringkat"
            className="grid min-w-0 content-start gap-6"
        >
            {!data.isCampusOperator && (
                <section
                    aria-labelledby="leaderboard-consent-title"
                    className="grid min-w-0 scroll-mt-24 gap-4 rounded-3xl border border-primary/20 bg-linear-to-br from-card to-accent/60 p-5 shadow-md sm:p-6"
                    data-test="leaderboard-consent"
                >
                    <div className="flex items-start gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                            <LockKeyhole
                                aria-hidden="true"
                                className="size-5"
                            />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-primary">
                                Pilihanmu
                            </p>
                            <h2
                                id="leaderboard-consent-title"
                                className="mt-1 text-title font-bold tracking-tight"
                            >
                                Peringkat individual
                            </h2>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className="w-fit max-w-full border-primary/15 bg-accent whitespace-normal text-primary"
                        data-test="leaderboard-preference-state"
                    >
                        {data.preference.isOptedIn
                            ? 'Persetujuan aktif'
                            : 'Belum diaktifkan'}
                    </Badge>
                    <p className="text-sm leading-6 text-muted-foreground">
                        {data.preference.isOptedIn
                            ? 'Kamu mengizinkan namamu masuk peringkat individual. Baris muncul setelah data terverifikasi dihitung oleh sistem.'
                            : 'Namamu tidak masuk peringkat individual tanpa persetujuan. Program studi dan tim tetap dapat kamu baca.'}
                    </p>
                    <p
                        role="status"
                        aria-live="polite"
                        className="min-h-5 text-xs leading-5 text-muted-foreground"
                        data-test="leaderboard-preference-processing"
                    >
                        {savingPreference ? 'Menyimpan persetujuan...' : ''}
                    </p>
                    <Button
                        type="button"
                        variant={
                            data.preference.isOptedIn ? 'outline' : 'default'
                        }
                        className="min-h-11 w-full whitespace-normal"
                        disabled={pending}
                        onClick={onPreference}
                        data-test="leaderboard-preference-action"
                    >
                        {savingPreference
                            ? 'Menyimpan persetujuan...'
                            : data.preference.isOptedIn
                              ? 'Tarik persetujuan'
                              : 'Atur visibilitas individual'}
                    </Button>
                    <p className="border-t border-primary/10 pt-4 text-xs leading-5 text-muted-foreground">
                        Pengaturan ini terpisah dari jangkauan Portofolio. XP
                        dan badge tidak terhapus jika kamu menarik persetujuan.
                    </p>
                </section>
            )}
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
                            XP hanya berasal dari kontribusi yang disetujui
                            kampus.
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
                            Skor sama berbagi peringkat yang sama. Nomor
                            berikutnya dapat melompat.
                        </span>
                    </li>
                </ul>
                {!individual && (
                    <details className="min-w-0 rounded-xl border border-border bg-card p-3">
                        <summary className="min-h-11 cursor-pointer rounded-lg py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                            Siapa anggota aktif?
                        </summary>
                        <p className="pt-2 text-xs leading-6 text-muted-foreground">
                            Anggota dengan afiliasi terverifikasi, tercatat
                            aktif pada roster semester, dan memiliki kontribusi
                            yang disetujui pada semester tersebut. Jumlah ini
                            menjadi pembagi skor, bukan seluruh mahasiswa
                            kampus.
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
                        {formatLeaderboardDate(data.period?.computedAt ?? null)}
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                        {data.period?.isStale
                            ? 'Snapshot perlu dihitung ulang. Memuat ulang halaman tidak menjalankan perhitungan.'
                            : data.period
                              ? 'Angka mengikuti snapshot server, bukan pembaruan langsung.'
                              : 'Belum ada snapshot untuk semester ini.'}
                    </p>
                    <p className="font-label text-label text-xs [overflow-wrap:anywhere] text-muted-foreground">
                        Versi aturan:{' '}
                        {data.period?.ruleVersion ?? 'belum tersedia'}
                    </p>
                </div>
            </section>
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
                {data.badges.length > 0 ? (
                    <ul
                        className="grid gap-3"
                        data-test="leaderboard-badge-list"
                    >
                        {data.badges.map((badge) => (
                            <li
                                key={badge.id}
                                className="grid min-w-0 gap-2 border-t border-border py-4 [overflow-wrap:anywhere]"
                            >
                                <div className="flex min-w-0 items-start justify-between gap-2">
                                    <h3 className="min-w-0 text-base leading-6 font-semibold">
                                        {badge.name}
                                    </h3>
                                    <Badge
                                        variant="outline"
                                        className="shrink-0"
                                    >
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
                                    {formatLeaderboardDate(badge.awardedAt)}.
                                    Aturan v{badge.ruleVersion}.
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
                {data.badges.length > 0 && (
                    <p className="text-xs leading-5 text-muted-foreground">
                        Badge tidak menambah skor peringkat.
                    </p>
                )}
            </section>
        </aside>
    );
}
