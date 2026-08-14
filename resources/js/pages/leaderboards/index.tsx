/**
 * THESIS: Leaderboard harus terasa seperti ledger yang bisa diaudit, bukan papan skor yang memancing performa semu.
 * OWN-WORLD: Garis aturan, angka monospaced, dan status terverifikasi meneruskan bahasa Buku Besar Kolaborasi.
 * STORY: Mulai dari konteks periode, baca tabel, lalu buka penjelasan sebelum mengambil keputusan.
 * FIRST VIEWPORT: Pengguna langsung melihat judul, periode, scope, freshness, dan beberapa baris ranking.
 * FORM: Tabel desktop berubah menjadi baris berlabel di mobile, dengan dialog untuk provenance dan opt-in.
 */

import { Deferred, Head, Link, router, usePage } from '@inertiajs/react';
import {
    Award,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    Info,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Trophy,
} from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { AppPage } from '@/components/app-page';
import { LeaderboardTable } from '@/components/leaderboards/leaderboard-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { index as contributionsIndex } from '@/routes/contributions';
import { index as leaderboardsIndex } from '@/routes/leaderboards';
import { individual as individualPreference } from '@/routes/leaderboards/preferences';
import type {
    LeaderboardPageProps,
    LeaderboardRow,
    LeaderboardRowsRegion,
} from '@/types';

function formatDate(value: string | null): string {
    if (value === null) {
        return 'Belum dihitung';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Waktu tidak tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
    }).format(date);
}

function suppressionLabel(reason: string | null): string {
    if (reason === 'cohort_below_minimum') {
        return 'Kohort belum memenuhi minimum publikasi 5 anggota aktif.';
    }

    return 'Detail angka ditahan sampai data memenuhi ambang publikasi.';
}

function LeaderboardLoading() {
    return (
        <section
            aria-busy="true"
            aria-labelledby="leaderboard-loading-title"
            className="grid gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
            data-test="leaderboard-loading"
        >
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                <Skeleton className="size-9 rounded-lg" />
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-64 max-w-[70vw]" />
                </div>
            </div>
            <p id="leaderboard-loading-title" role="status" className="sr-only">
                Memuat papan peringkat.
            </p>
            <div className="grid gap-0">
                {Array.from({ length: 10 }, (_, item) => item).map((item) => (
                    <div
                        key={item}
                        className="border-t border-slate-100 px-5 py-4 sm:px-6"
                    >
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                ))}
            </div>
        </section>
    );
}

function LeaderboardRefreshLoading() {
    return (
        <div
            className="grid gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:px-6"
            data-test="leaderboard-refresh-loading"
        >
            <p role="status" className="sr-only">
                Memuat pembaruan leaderboard.
            </p>
            <div aria-hidden="true" className="grid gap-2 opacity-60">
                <Skeleton className="h-3 w-48 rounded-none" />
                <Skeleton className="h-12 w-full rounded-none" />
            </div>
        </div>
    );
}

function PeriodTabs({
    semesters,
    selectedSemester,
    onChange,
}: {
    semesters: LeaderboardPageProps['leaderboard']['semesters'];
    selectedSemester: string;
    onChange: (semester: string) => void;
}) {
    function handleKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ) {
        if (semesters.length < 2) {
            return;
        }

        let nextIndex = index;

        if (event.key === 'ArrowRight') {
            nextIndex = (index + 1) % semesters.length;
        } else if (event.key === 'ArrowLeft') {
            nextIndex = (index - 1 + semesters.length) % semesters.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = semesters.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        const nextSemester = semesters[nextIndex];

        if (nextSemester !== undefined) {
            onChange(nextSemester.value);
            document
                .querySelector<HTMLButtonElement>(
                    `[data-leaderboard-period="${CSS.escape(nextSemester.value)}"]`,
                )
                ?.focus();
        }
    }

    return (
        <div
            aria-label="Periode leaderboard"
            className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1"
            role="tablist"
        >
            {semesters.map((semester, index) => {
                const isSelected = semester.value === selectedSemester;

                return (
                    <button
                        key={semester.value}
                        type="button"
                        role="tab"
                        aria-controls="leaderboard-results"
                        aria-selected={isSelected}
                        className={cn(
                            'min-h-control-md shrink-0 cursor-pointer rounded-lg px-3 font-label text-label font-semibold transition-[color,background-color,box-shadow] duration-fast ease-ledger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 motion-reduce:transition-none',
                            isSelected
                                ? 'bg-white text-blue-700'
                                : 'text-slate-500 hover:bg-white/70 hover:text-slate-900',
                        )}
                        data-leaderboard-period={semester.value}
                        data-test="leaderboard-period-tab"
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => onChange(semester.value)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                    >
                        {semester.label}
                    </button>
                );
            })}
        </div>
    );
}

function StateNotice({
    tone,
    title,
    children,
}: {
    tone: 'info' | 'warning' | 'error';
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
            className={cn(
                'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6',
                tone === 'error' &&
                    'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
                tone === 'warning' &&
                    'border-pending/30 bg-pending-subtle text-pending-subtle-foreground',
                tone === 'info' && 'border-border bg-muted/50 text-foreground',
            )}
            data-test={`leaderboard-notice-${tone}`}
            role={tone === 'error' ? 'alert' : 'status'}
        >
            <Icon aria-hidden="true" className="mt-1 size-4 shrink-0" />
            <div>
                <p className="font-semibold">{title}</p>
                <div className="mt-1">{children}</div>
            </div>
        </div>
    );
}

function EmptyLeaderboard({
    reason,
    onOptIn,
    isCampusOperator,
}: {
    reason: LeaderboardRowsRegion['emptyReason'];
    onOptIn: () => void;
    isCampusOperator: boolean;
}) {
    if (reason === 'opt_in_required') {
        return (
            <section
                aria-labelledby="leaderboard-opt-in-title"
                className="grid gap-5 rounded-2xl border border-blue-100 bg-white px-5 py-6"
                data-test="leaderboard-opt-in-preview"
            >
                <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                        <LockKeyhole aria-hidden="true" className="size-5" />
                    </div>
                    <div className="grid gap-1">
                        <h2
                            id="leaderboard-opt-in-title"
                            className="font-semibold"
                        >
                            Ranking individual bersifat pilihan
                        </h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Kamu bisa melihat pratinjau dulu. Jika diaktifkan,
                            nama, peringkat, dan skor XP terverifikasi akan
                            tampil di scope individual pada kampusmu.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        type="button"
                        className="cursor-pointer"
                        onClick={onOptIn}
                        data-test="leaderboard-opt-in-open"
                    >
                        <Sparkles aria-hidden="true" />
                        Tampilkan ranking saya
                    </Button>
                    <span className="text-xs leading-5 text-muted-foreground">
                        Bisa ditarik kapan saja.
                    </span>
                </div>
            </section>
        );
    }

    return (
        <section
            aria-labelledby="leaderboard-empty-title"
            className="grid justify-items-start gap-5 rounded-2xl border border-slate-200 bg-white px-5 py-10 md:px-6"
            data-test="leaderboard-empty"
        >
            <div className="grid gap-2">
                <h2 id="leaderboard-empty-title" className="font-semibold">
                    Belum ada XP terverifikasi untuk periode ini
                </h2>
                <p className="max-w-[60ch] text-sm leading-6 text-muted-foreground">
                    Ranking akan muncul setelah data contribution melewati
                    validasi dan proyeksi leaderboard selesai dihitung.
                </p>
            </div>
            {!isCampusOperator && (
                <Button
                    asChild
                    variant="outline"
                    className="w-fit cursor-pointer"
                >
                    <Link href={contributionsIndex()}>
                        Lihat contribution saya
                    </Link>
                </Button>
            )}
        </section>
    );
}

function LeaderboardContextRail({
    data,
}: {
    data: LeaderboardPageProps['leaderboard'];
}) {
    return (
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <section
                aria-labelledby="leaderboard-method-title"
                className="grid gap-4 px-5 py-5"
            >
                <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                        <Trophy aria-hidden="true" className="size-4" />
                    </span>
                    <div className="grid gap-1">
                        <h2
                            id="leaderboard-method-title"
                            className="text-title font-bold"
                        >
                            Cara membaca
                        </h2>
                        <p className="text-sm leading-6 text-slate-600">
                            Ranking ini membantu membaca aktivitas yang sudah
                            tervalidasi, bukan menilai individu.
                        </p>
                    </div>
                </div>
                <dl className="grid gap-3 border-y border-slate-100 py-4 text-sm">
                    <div className="grid gap-1">
                        <dt className="text-slate-500">Skor</dt>
                        <dd className="font-label text-label font-semibold text-slate-900">
                            Rata-rata XP terverifikasi
                        </dd>
                    </div>
                    <div className="grid gap-1">
                        <dt className="text-slate-500">Denominator</dt>
                        <dd className="font-label text-label font-semibold text-slate-900">
                            Anggota aktif pada scope
                        </dd>
                    </div>
                    <div className="grid gap-1">
                        <dt className="text-slate-500">Minimum publikasi</dt>
                        <dd className="font-label text-label font-semibold text-slate-900">
                            5 anggota aktif
                        </dd>
                    </div>
                </dl>
                <p className="text-sm leading-6 text-slate-600">
                    Angka yang belum memenuhi ambang ditahan. Status itu tetap
                    terlihat supaya hasil tidak disalahartikan.
                </p>
            </section>

            <section
                aria-labelledby="leaderboard-freshness-title"
                className="grid gap-3 border-t border-slate-100 px-5 py-5"
            >
                <div className="flex items-center gap-2">
                    <RefreshCw
                        aria-hidden="true"
                        className="size-4 text-blue-700"
                    />
                    <h2
                        id="leaderboard-freshness-title"
                        className="font-semibold"
                    >
                        Freshness
                    </h2>
                </div>
                <p className="text-sm leading-6 text-slate-600">
                    Dihitung {formatDate(data.period?.computedAt ?? null)}.
                    {data.period?.isStale
                        ? ' Data perlu diproses ulang oleh sistem.'
                        : ' Sumber tetap berasal dari proyeksi server.'}
                </p>
                <span className="font-label text-label text-slate-500">
                    Rule version {data.period?.ruleVersion ?? 'belum tersedia'}
                </span>
            </section>

            <section
                aria-labelledby="leaderboard-badge-title"
                className="grid gap-3 border-t border-slate-100 px-5 py-5"
            >
                <div className="flex items-center gap-2">
                    <Award
                        aria-hidden="true"
                        className="size-4 text-blue-700"
                    />
                    <h2 id="leaderboard-badge-title" className="font-semibold">
                        Badge terverifikasi
                    </h2>
                </div>
                {data.badges.length > 0 ? (
                    <ul
                        className="grid gap-3"
                        data-test="leaderboard-badge-list"
                    >
                        {data.badges.map((badge) => (
                            <li
                                key={badge.id}
                                className="grid gap-1 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="font-semibold">
                                        {badge.name}
                                    </span>
                                    <Badge variant="outline">
                                        Lv. {badge.level}
                                    </Badge>
                                </div>
                                <p className="text-xs leading-5 text-slate-600">
                                    {badge.description}
                                </p>
                                <span className="font-label text-label text-xs text-slate-500">
                                    {badge.sourceLabel}, rule v
                                    {badge.ruleVersion}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm leading-6 text-slate-600">
                        Belum ada badge yang bisa ditampilkan dari sumber
                        terverifikasi.
                    </p>
                )}
            </section>

            <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-5 text-sm leading-6 text-slate-600">
                <LockKeyhole
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-blue-700"
                />
                <p>
                    Data inclusion, evidence privat, dan audit mentah tidak
                    pernah masuk ke leaderboard.
                </p>
            </div>
        </div>
    );
}

export default function LeaderboardIndex() {
    const { leaderboard, leaderboardRows } =
        usePage<LeaderboardPageProps>().props;
    const [isNavigating, setIsNavigating] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [pendingPreference, setPendingPreference] = useState(false);
    const [optInDialogOpen, setOptInDialogOpen] = useState(false);
    const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
    const [explanationRow, setExplanationRow] = useState<LeaderboardRow | null>(
        null,
    );

    function navigateTo(
        semester: string,
        scope = leaderboard.scope,
        page = 1,
    ): void {
        setLoadError(false);
        setIsNavigating(true);
        router.get(
            leaderboardsIndex(),
            { semester, scope, page },
            {
                only: ['leaderboard', 'leaderboardRows'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onError: () => setLoadError(true),
                onFinish: () => setIsNavigating(false),
            },
        );
    }

    function refresh(): void {
        setLoadError(false);
        setIsNavigating(true);
        router.reload({
            only: ['leaderboard', 'leaderboardRows'],
            onError: () => setLoadError(true),
            onFinish: () => setIsNavigating(false),
        });
    }

    function submitPreference(isOptedIn: boolean): void {
        setPendingPreference(true);
        setLoadError(false);
        setOptInDialogOpen(false);
        setWithdrawDialogOpen(false);
        router.post(
            individualPreference().url,
            {
                is_opted_in: isOptedIn,
                semester: leaderboard.semester || undefined,
                scope: leaderboard.scope,
            },
            {
                only: ['leaderboard', 'leaderboardRows'],
                preserveScroll: true,
                onError: () => setLoadError(true),
                onFinish: () => setPendingPreference(false),
            },
        );
    }

    if (leaderboard.state === 'forbidden') {
        return (
            <>
                <Head title="Leaderboard" />
                <AppPage>
                    <div
                        className="mx-auto grid max-w-3xl gap-6"
                        data-test="leaderboard-root"
                    >
                        <header className="grid gap-4 rounded-2xl border border-blue-100 bg-white px-5 py-6 sm:px-7">
                            <p className="text-xs font-bold tracking-[0.13em] text-blue-700 uppercase">
                                Aktivitas terverifikasi
                            </p>
                            <h1 className="text-headline font-bold tracking-[-0.03em] text-slate-950">
                                Leaderboard belum tersedia
                            </h1>
                            <p className="max-w-[65ch] text-body text-slate-600">
                                Hubungkan dan verifikasi afiliasi kampus sebelum
                                membuka proyeksi leaderboard.
                            </p>
                        </header>
                        <StateNotice
                            tone="warning"
                            title="Akses belum terverifikasi"
                        >
                            <p>
                                Leaderboard hanya memproyeksikan data untuk
                                anggota kampus yang terverifikasi.
                            </p>
                        </StateNotice>
                    </div>
                </AppPage>
            </>
        );
    }

    const rows = leaderboardRows;
    const hasRows = rows?.state === 'ready' && rows.rows.length > 0;
    const isStale = leaderboard.period?.isStale ?? false;

    return (
        <>
            <Head title="Leaderboard" />
            <AppPage
                contextRail={<LeaderboardContextRail data={leaderboard} />}
                contextRailLabel="Metode dan provenance leaderboard"
            >
                <div
                    className="mx-auto grid max-w-7xl min-w-0 gap-6"
                    data-leaderboard-source="application"
                    data-test="leaderboard-root"
                >
                    <header
                        className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-white px-5 py-6 sm:px-7 sm:py-7"
                        data-test="leaderboard-header"
                    >
                        <div
                            aria-hidden="true"
                            className="absolute -top-28 -right-24 size-72 rounded-full bg-blue-100/70 blur-3xl"
                        />
                        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.46fr)] lg:items-stretch lg:gap-10">
                            <div className="min-w-0">
                                <p className="flex items-center gap-2 text-xs font-bold tracking-[0.13em] text-blue-700 uppercase">
                                    <span className="size-1.5 rounded-full bg-blue-600" />
                                    Aktivitas terverifikasi
                                </p>
                                <h1 className="mt-4 max-w-[23ch] text-headline font-bold tracking-[-0.035em] text-balance text-slate-950">
                                    Lihat pola kontribusi, tanpa kehilangan
                                    konteks.
                                </h1>
                                <p className="mt-3 max-w-[66ch] text-sm leading-6 text-slate-600">
                                    Ranking ini merangkum aktivitas yang telah
                                    tervalidasi. Ia bukan ukuran nilai pribadi
                                    dan tidak memuat sinyal inclusion.
                                </p>
                            </div>

                            <div className="flex flex-col justify-end border-t border-slate-200 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.13em] text-slate-500 uppercase">
                                    <ShieldCheck
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-verified"
                                    />
                                    Dasar peringkat
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Skor dihitung dari rata-rata XP
                                    terverifikasi per anggota aktif dalam satu
                                    periode.
                                </p>
                                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                                    <div className="grid gap-1">
                                        <dt className="text-xs font-bold tracking-[0.11em] text-slate-500 uppercase">
                                            Periode
                                        </dt>
                                        <dd className="text-sm font-semibold text-slate-900">
                                            {leaderboard.semester ||
                                                'Belum tersedia'}
                                        </dd>
                                    </div>
                                    <div className="grid gap-1">
                                        <dt className="text-xs font-bold tracking-[0.11em] text-slate-500 uppercase">
                                            Ambang
                                        </dt>
                                        <dd className="text-sm font-semibold text-slate-900">
                                            5 anggota aktif
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </header>

                    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                        <Info
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0 text-blue-700"
                        />
                        <p>
                            {leaderboard.institution?.name ?? 'Kampus'}, periode{' '}
                            <span className="font-semibold text-slate-900">
                                {leaderboard.semester || 'belum tersedia'}
                            </span>
                            . Setiap baris menyimpan penjelasan denominator dan
                            provenance rule.
                        </p>
                    </div>

                    <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                        {leaderboard.semesters.length > 0 && (
                            <PeriodTabs
                                semesters={leaderboard.semesters}
                                selectedSemester={leaderboard.semester}
                                onChange={(semester) => navigateTo(semester)}
                            />
                        )}

                        <section
                            aria-labelledby="leaderboard-filter-title"
                            className="grid gap-4"
                        >
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div className="grid gap-1">
                                    <p className="text-xs font-bold tracking-[0.13em] text-blue-700 uppercase">
                                        Tampilan peringkat
                                    </p>
                                    <h2
                                        id="leaderboard-filter-title"
                                        className="mt-1 text-title font-bold tracking-[-0.02em] text-slate-950"
                                    >
                                        Pilih scope
                                    </h2>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                        Scope tersimpan di URL agar bisa
                                        dibagikan tanpa membawa data privat.
                                    </p>
                                </div>
                                <label className="grid min-w-52 gap-2">
                                    <span className="font-label text-label text-slate-500">
                                        Scope leaderboard
                                    </span>
                                    <select
                                        aria-label="Scope leaderboard"
                                        className="min-h-control-md cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-hidden transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-blue-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100"
                                        data-test="leaderboard-scope-select"
                                        value={leaderboard.scope}
                                        onChange={(event) =>
                                            navigateTo(
                                                leaderboard.semester,
                                                event.target
                                                    .value as typeof leaderboard.scope,
                                            )
                                        }
                                    >
                                        {leaderboard.scopes.map((scope) => (
                                            <option
                                                key={scope.value}
                                                value={scope.value}
                                            >
                                                {scope.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            {leaderboard.scope === 'individual' && (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                                    <p className="leading-6 text-slate-600">
                                        {leaderboard.preference.isOptedIn
                                            ? 'Ranking individual kamu sedang terlihat di scope ini.'
                                            : 'Scope individual hanya aktif setelah kamu menyetujuinya.'}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="cursor-pointer"
                                        disabled={pendingPreference}
                                        onClick={() =>
                                            leaderboard.preference.isOptedIn
                                                ? setWithdrawDialogOpen(true)
                                                : setOptInDialogOpen(true)
                                        }
                                        data-test="leaderboard-preference-action"
                                    >
                                        {pendingPreference && <Spinner />}
                                        {leaderboard.preference.isOptedIn
                                            ? 'Tarik dari ranking'
                                            : 'Atur visibilitas'}
                                    </Button>
                                </div>
                            )}
                        </section>
                    </div>

                    {isStale && (
                        <StateNotice
                            tone="warning"
                            title="Data sedang menunggu perhitungan ulang"
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <p>
                                    Nilai yang tampil berasal dari snapshot
                                    terakhir dan bisa berubah setelah proses
                                    selesai.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={refresh}
                                    disabled={isNavigating}
                                    data-test="leaderboard-refresh"
                                >
                                    {isNavigating && <Spinner />}
                                    Segarkan status
                                </Button>
                            </div>
                        </StateNotice>
                    )}

                    {loadError && (
                        <StateNotice
                            tone="error"
                            title="Leaderboard belum bisa dimuat"
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <p>
                                    Periksa koneksi lalu coba lagi. Data
                                    sebelumnya tetap menjadi sumber keputusan
                                    sampai snapshot baru tersedia.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={refresh}
                                    disabled={isNavigating}
                                    data-test="leaderboard-retry"
                                >
                                    {isNavigating && <Spinner />}
                                    Coba lagi
                                </Button>
                            </div>
                        </StateNotice>
                    )}

                    <section
                        id="leaderboard-results"
                        aria-labelledby="leaderboard-results-title"
                        className="grid gap-4"
                        aria-busy={isNavigating}
                    >
                        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                            <div>
                                <p className="text-xs font-bold tracking-[0.13em] text-blue-700 uppercase">
                                    Rekam peringkat
                                </p>
                                <h2
                                    id="leaderboard-results-title"
                                    className="mt-1 text-title font-bold tracking-[-0.02em] text-slate-950"
                                >
                                    {leaderboard.scopes.find(
                                        (scope) =>
                                            scope.value === leaderboard.scope,
                                    )?.label ?? 'Leaderboard'}
                                </h2>
                            </div>
                            {rows?.pagination && (
                                <p className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-label text-label text-slate-500">
                                    {rows.pagination.total} baris, halaman{' '}
                                    {rows.pagination.currentPage}/
                                    {rows.pagination.lastPage}
                                </p>
                            )}
                        </div>

                        {isNavigating && <LeaderboardRefreshLoading />}

                        <Deferred
                            data="leaderboardRows"
                            fallback={<LeaderboardLoading />}
                        >
                            {hasRows ? (
                                <>
                                    <LeaderboardTable
                                        rows={rows.rows}
                                        onExplain={setExplanationRow}
                                    />
                                    {rows.pagination.lastPage > 1 && (
                                        <nav
                                            aria-label="Navigasi halaman leaderboard"
                                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                                        >
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer"
                                                disabled={
                                                    rows.pagination
                                                        .currentPage <= 1 ||
                                                    isNavigating
                                                }
                                                onClick={() =>
                                                    navigateTo(
                                                        leaderboard.semester,
                                                        leaderboard.scope,
                                                        rows.pagination
                                                            .currentPage - 1,
                                                    )
                                                }
                                                data-test="leaderboard-previous-page"
                                            >
                                                <ChevronLeft aria-hidden="true" />
                                                Sebelumnya
                                            </Button>
                                            <span className="font-label text-label text-xs text-muted-foreground">
                                                Halaman{' '}
                                                {rows.pagination.currentPage}{' '}
                                                dari {rows.pagination.lastPage}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer"
                                                disabled={
                                                    rows.pagination
                                                        .currentPage >=
                                                        rows.pagination
                                                            .lastPage ||
                                                    isNavigating
                                                }
                                                onClick={() =>
                                                    navigateTo(
                                                        leaderboard.semester,
                                                        leaderboard.scope,
                                                        rows.pagination
                                                            .currentPage + 1,
                                                    )
                                                }
                                                data-test="leaderboard-next-page"
                                            >
                                                Berikutnya
                                                <ChevronRight aria-hidden="true" />
                                            </Button>
                                        </nav>
                                    )}
                                </>
                            ) : rows?.state === 'empty' ? (
                                <EmptyLeaderboard
                                    reason={rows.emptyReason}
                                    onOptIn={() => setOptInDialogOpen(true)}
                                    isCampusOperator={
                                        leaderboard.isCampusOperator
                                    }
                                />
                            ) : (
                                <LeaderboardLoading />
                            )}
                        </Deferred>
                    </section>
                </div>
            </AppPage>

            <Dialog open={optInDialogOpen} onOpenChange={setOptInDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tampilkan ranking individual?</DialogTitle>
                        <DialogDescription className="text-foreground">
                            Persetujuan ini hanya mengatur proyeksi leaderboard
                            individual.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 border-y border-border py-4 text-sm leading-6">
                        <p>
                            <strong>Yang terlihat:</strong> nama, peringkat,
                            skor XP terverifikasi, dan denominator.
                        </p>
                        <p>
                            <strong>Yang tidak terlihat:</strong> inclusion,
                            evidence privat, isi diskusi, dan audit mentah.
                        </p>
                        <p>
                            Kamu bisa menarik persetujuan kapan saja. Perubahan
                            diterapkan pada snapshot berikutnya.
                        </p>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                            >
                                Batal
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => submitPreference(true)}
                            disabled={pendingPreference}
                            data-test="leaderboard-opt-in-confirm"
                        >
                            {pendingPreference && <Spinner />}
                            Setujui dan tampilkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={withdrawDialogOpen}
                onOpenChange={setWithdrawDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Tarik dari ranking individual?
                        </DialogTitle>
                        <DialogDescription className="text-foreground">
                            Nama dan proyeksi individual kamu tidak akan
                            ditampilkan lagi pada snapshot berikutnya.
                        </DialogDescription>
                    </DialogHeader>
                    <StateNotice tone="info" title="Kontrol tetap di tanganmu">
                        <p>
                            Penarikan tidak menghapus XP terverifikasi atau
                            badge milikmu.
                        </p>
                    </StateNotice>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                            >
                                Tetap tampil
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={() => submitPreference(false)}
                            disabled={pendingPreference}
                            data-test="leaderboard-withdraw-confirm"
                        >
                            {pendingPreference && <Spinner />}
                            Tarik persetujuan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={explanationRow !== null}
                onOpenChange={(open) => !open && setExplanationRow(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Penjelasan baris leaderboard</DialogTitle>
                        <DialogDescription className="text-foreground">
                            Provenance ini membantu membaca angka tanpa membuka
                            data privat.
                        </DialogDescription>
                    </DialogHeader>
                    {explanationRow && (
                        <div className="grid gap-4">
                            <div className="border-y border-border py-4">
                                <p className="font-semibold">
                                    {explanationRow.scopeLabel ??
                                        'Entitas tanpa nama'}
                                </p>
                                <p className="mt-1 text-sm text-foreground">
                                    Scope {explanationRow.scopeType}, periode{' '}
                                    {leaderboard.semester || 'tidak tersedia'}
                                </p>
                            </div>
                            {explanationRow.suppressed ? (
                                <StateNotice
                                    tone="warning"
                                    title="Kohort dilindungi"
                                >
                                    <p>
                                        {suppressionLabel(
                                            explanationRow.suppressionReason,
                                        )}
                                    </p>
                                </StateNotice>
                            ) : (
                                <dl className="grid gap-3 text-sm">
                                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                                        <dt className="text-foreground">
                                            Skor
                                        </dt>
                                        <dd className="font-label text-label font-semibold tabular-nums">
                                            {new Intl.NumberFormat('id-ID', {
                                                maximumFractionDigits: 4,
                                                minimumFractionDigits: 2,
                                            }).format(
                                                Number(explanationRow.score),
                                            )}{' '}
                                            XP
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                                        <dt className="text-foreground">
                                            XP terverifikasi
                                        </dt>
                                        <dd className="font-label text-label font-semibold tabular-nums">
                                            {new Intl.NumberFormat(
                                                'id-ID',
                                            ).format(
                                                explanationRow.verifiedXpTotal,
                                            )}{' '}
                                            XP
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                                        <dt className="text-foreground">
                                            Denominator aktif
                                        </dt>
                                        <dd className="font-label text-label font-semibold tabular-nums">
                                            {new Intl.NumberFormat(
                                                'id-ID',
                                            ).format(
                                                explanationRow.activeMemberDenominator,
                                            )}{' '}
                                            anggota
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <dt className="text-foreground">
                                            Rule
                                        </dt>
                                        <dd className="font-label text-label font-semibold">
                                            v
                                            {leaderboard.period?.ruleVersion ??
                                                'belum tersedia'}
                                        </dd>
                                    </div>
                                </dl>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

LeaderboardIndex.layout = {
    breadcrumbs: [
        {
            title: 'Leaderboard',
            href: leaderboardsIndex(),
        },
    ],
};
