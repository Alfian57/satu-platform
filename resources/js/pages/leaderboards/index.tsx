import { Deferred, Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpenCheck,
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    GraduationCap,
    Info,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
    UserRound,
    Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import {
    formatLeaderboardDate,
    LeaderboardContext,
    LeaderboardNotice,
} from '@/components/leaderboards/leaderboard-context';
import {
    formatNumber,
    formatScore,
    LeaderboardTable,
} from '@/components/leaderboards/leaderboard-table';
import Mascot from '@/components/mascot';
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
import { dashboard } from '@/routes';
import { index as contributionsIndex } from '@/routes/contributions';
import { index as leaderboardsIndex } from '@/routes/leaderboards';
import { individual as individualPreference } from '@/routes/leaderboards/preferences';
import type {
    LeaderboardPageProps,
    LeaderboardRow,
    LeaderboardScope,
} from '@/types/leaderboard';

type Selection = { semester: string; scope: LeaderboardScope; page: number };
const categoryIcons = {
    program: GraduationCap,
    team: Users,
    individual: UserRound,
};
const categoryDescriptions = {
    program: 'Rata-rata XP per anggota aktif',
    team: 'Rata-rata XP dalam tim proyek',
    individual: 'Total XP, dengan persetujuan',
};

function LeaderboardLoading({ refreshing = false }: { refreshing?: boolean }) {
    return (
        <div
            aria-busy="true"
            className="grid min-w-0 gap-4 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-6"
            data-test={
                refreshing
                    ? 'leaderboard-refresh-loading'
                    : 'leaderboard-loading'
            }
        >
            <p
                role="status"
                className="flex items-center gap-2 text-sm text-muted-foreground"
            >
                <RefreshCw
                    aria-hidden="true"
                    className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
                />
                {refreshing
                    ? 'Memperbarui hasil. Data sebelumnya tetap terlihat.'
                    : 'Memuat peringkat terverifikasi.'}
            </p>
            <div aria-hidden="true" className="grid min-w-0 gap-4">
                {Array.from({ length: refreshing ? 1 : 4 }, (_, index) => (
                    <div
                        key={index}
                        className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] gap-4 border-t border-border py-5"
                    >
                        <Skeleton className="size-12 rounded-2xl" />
                        <div className="grid min-w-0 gap-3">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function LeaderboardIndex() {
    const { leaderboard, leaderboardRows } =
        usePage<LeaderboardPageProps>().props;
    const [isNavigating, setIsNavigating] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [pendingPreference, setPendingPreference] = useState(false);
    const [preferenceIntent, setPreferenceIntent] = useState<boolean | null>(
        null,
    );
    const [preferenceError, setPreferenceError] = useState<string | null>(null);
    const [preferenceFeedback, setPreferenceFeedback] = useState<string | null>(
        null,
    );
    const [explanationRow, setExplanationRow] = useState<LeaderboardRow | null>(
        null,
    );
    const [failedSelection, setFailedSelection] = useState<Selection | null>(
        null,
    );
    const preferenceErrorRef = useRef<HTMLDivElement>(null);
    const preferenceReturnFocus = useRef<HTMLElement | null>(null);
    const explanationReturnFocus = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (preferenceError && preferenceIntent !== null) {
            preferenceErrorRef.current?.focus();
        }
    }, [preferenceError, preferenceIntent]);

    useEffect(() => {
        let activeRowsVisit: string | null = null;
        const removeStart = router.on('start', (event) => {
            const visit = event.detail.visit;
            const isRowsVisit =
                visit.method === 'get' &&
                visit.url.pathname ===
                    new URL(leaderboardsIndex.url(), window.location.origin)
                        .pathname &&
                visit.only.includes('leaderboardRows');
            activeRowsVisit = isRowsVisit ? visit.id : null;
        });
        const removeFinish = router.on('finish', (event) => {
            if (event.detail.visit.id === activeRowsVisit) {
                activeRowsVisit = null;
            }
        });
        const removeHttp = router.on('httpException', (event) => {
            if (activeRowsVisit === null) {
                return;
            }

            if ([401, 403].includes(event.detail.response.status)) {
                setIsForbidden(true);
                setExplanationRow(null);
                setPreferenceIntent(null);
            }

            setLoadError(
                [401, 403].includes(event.detail.response.status)
                    ? 'Akses peringkat tidak tersedia. Periksa afiliasi atau masuk kembali, lalu coba muat ulang.'
                    : 'Hasil belum dapat dimuat. Data tersimpan tidak berubah. Coba muat ulang.',
            );
            event.preventDefault();
        });
        const removeNetwork = router.on('networkError', (event) => {
            if (activeRowsVisit === null) {
                return;
            }

            setLoadError(
                'Hasil belum dapat dimuat. Data tersimpan tidak berubah. Periksa koneksi dan coba lagi.',
            );
            event.preventDefault();
        });

        return () => {
            removeStart();
            removeFinish();
            removeHttp();
            removeNetwork();
        };
    }, []);

    function requestRows(selection: Selection | null = null): void {
        if (isNavigating || pendingPreference) {
            return;
        }

        setFailedSelection(selection);
        setLoadError(null);
        setIsNavigating(true);
        setExplanationRow(null);
        setPreferenceIntent(null);
        setPreferenceFeedback(null);
        const options = {
            only: ['leaderboard', 'leaderboardRows'],
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setIsForbidden(false);
                setLoadError(null);
                setFailedSelection(null);
                setPreferenceError(null);
            },
            onError: () =>
                setLoadError(
                    'Pilihan belum dapat diterapkan. Hasil sebelumnya tetap tersimpan. Coba lagi.',
                ),
            onHttpException: (response: { status: number }) => {
                if ([401, 403].includes(response.status)) {
                    setIsForbidden(true);
                }

                setLoadError(
                    [401, 403].includes(response.status)
                        ? 'Akses peringkat tidak tersedia. Periksa afiliasi atau masuk kembali, lalu coba muat ulang.'
                        : 'Hasil belum dapat diperbarui. Data tersimpan tidak berubah. Coba lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setLoadError(
                    'Hasil belum dapat diperbarui. Data tersimpan tidak berubah. Periksa koneksi dan coba lagi.',
                );

                return false;
            },
            onFinish: () => setIsNavigating(false),
        };

        if (selection) {
            router.get(leaderboardsIndex(), selection, {
                ...options,
                replace: true,
            });
        } else {
            router.reload(options);
        }
    }

    function openPreference(): void {
        preferenceReturnFocus.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
        setPreferenceError(null);
        setPreferenceFeedback(null);
        setPreferenceIntent(!leaderboard.preference.isOptedIn);
    }

    function submitPreference(isOptedIn: boolean): void {
        if (pendingPreference) {
            return;
        }

        setPendingPreference(true);
        setPreferenceError(null);
        setExplanationRow(null);
        router.post(
            individualPreference(),
            {
                is_opted_in: isOptedIn,
                semester: leaderboard.semester || undefined,
                scope: leaderboard.scope,
            },
            {
                only: ['leaderboard', 'leaderboardRows'],
                preserveScroll: true,
                onSuccess: () => {
                    setPreferenceIntent(null);
                    setLoadError(null);
                    setPreferenceFeedback(
                        isOptedIn
                            ? 'Persetujuan tersimpan. Peringkat individual akan mengikuti hasil perhitungan server.'
                            : 'Persetujuan ditarik. Baris individual tidak ditampilkan pada pembacaan berikutnya. XP dan badge tetap tersimpan.',
                    );
                },
                onError: (errors) =>
                    setPreferenceError(
                        Object.values(errors).join(' ') ||
                            'Persetujuan belum tersimpan. Periksa pilihan dan coba lagi.',
                    ),
                onHttpException: (response) => {
                    if ([401, 403].includes(response.status)) {
                        setIsForbidden(true);
                        setPreferenceIntent(null);
                        setLoadError(
                            'Akses peringkat tidak tersedia. Persetujuan belum dapat dikonfirmasi. Periksa afiliasi lalu muat ulang.',
                        );
                    } else {
                        setPreferenceError(
                            'Persetujuan belum dapat dikonfirmasi. Periksa status dengan memuat ulang sebelum mencoba kembali.',
                        );
                    }

                    return false;
                },
                onNetworkError: () => {
                    setPreferenceError(
                        'Koneksi terputus. Persetujuan belum dapat dikonfirmasi. Periksa koneksi dan muat ulang untuk memastikan statusnya.',
                    );

                    return false;
                },
                onFinish: () => setPendingPreference(false),
            },
        );
    }

    const forbidden =
        isForbidden ||
        leaderboard.state === 'forbidden' ||
        leaderboardRows?.state === 'forbidden';
    const rows = leaderboardRows;
    const hasRows = rows?.state === 'ready' && rows.rows.length > 0;
    const selectedCategory = leaderboard.scopes.find(
        (scope) => scope.value === leaderboard.scope,
    );
    const individual = leaderboard.scope === 'individual';
    const busy = isNavigating || pendingPreference;

    if (forbidden) {
        return (
            <>
                <Head title="Peringkat" />
                <AppPage>
                    <div
                        className="grid w-full min-w-0 gap-6"
                        data-test="leaderboard-root"
                    >
                        <header className="grid min-w-0 gap-4 rounded-4xl border border-white bg-linear-to-br from-accent via-sky-100 to-blue-100 p-5 shadow-md sm:p-7">
                            <LockKeyhole
                                aria-hidden="true"
                                className="size-10 text-primary"
                            />
                            <p className="text-sm font-semibold text-primary">
                                Akses kampus
                            </p>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Peringkat belum tersedia.
                            </h1>
                            <p className="max-w-[65ch] text-sm leading-7 text-muted-foreground">
                                Peringkat hanya tersedia bagi anggota kampus
                                dengan akses yang terverifikasi. Hasil
                                sebelumnya tidak ditampilkan.
                            </p>
                        </header>
                        <LeaderboardNotice
                            tone="warning"
                            title="Periksa akses kampus"
                        >
                            <p>
                                {loadError ??
                                    'Periksa status afiliasi di Beranda, lalu muat ulang setelah akses tersedia.'}
                            </p>
                        </LeaderboardNotice>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                asChild
                                variant="outline"
                                className="min-h-11"
                            >
                                <Link href={dashboard()}>
                                    Kembali ke Beranda
                                </Link>
                            </Button>
                            <Button
                                onClick={() => requestRows()}
                                disabled={busy}
                                className="min-h-11"
                                data-test="leaderboard-retry"
                            >
                                {busy ? (
                                    <Spinner
                                        aria-hidden="true"
                                        className="motion-reduce:animate-none"
                                    />
                                ) : (
                                    <RefreshCw aria-hidden="true" />
                                )}
                                Muat ulang
                            </Button>
                        </div>
                    </div>
                </AppPage>
            </>
        );
    }

    return (
        <>
            <Head title="Peringkat" />
            <AppPage>
                <div
                    className="grid w-full min-w-0 gap-6"
                    data-leaderboard-source="application"
                    data-test="leaderboard-root"
                >
                    <header
                        className="relative isolate min-w-0 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent via-sky-100 to-blue-100 p-5 shadow-md sm:p-7"
                        data-test="leaderboard-header"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-20 -right-16 size-80 rounded-full bg-primary/5"
                        />
                        <ArchiveArt className="absolute top-5 right-28 hidden w-36 -rotate-6 opacity-55 sm:block lg:right-36 lg:w-44" />
                        <span
                            aria-hidden="true"
                            className="absolute top-7 right-7 h-1.5 w-10 -rotate-12 rounded-full bg-satu-feather/70"
                        />
                        <div className="relative grid min-w-0 items-center gap-6 sm:grid-cols-[minmax(0,1fr)_8rem] lg:grid-cols-[minmax(0,1fr)_10rem]">
                            <div className="min-w-0">
                                <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary">
                                    <BookOpenCheck
                                        aria-hidden="true"
                                        className="size-4 shrink-0"
                                    />
                                    Peringkat kontribusi
                                </p>
                                <h1 className="mt-4 max-w-[28ch] text-2xl leading-snug font-bold tracking-tight text-balance sm:text-3xl">
                                    Apresiasi kontribusi. Pahami konteksnya.
                                </h1>
                                <p className="mt-3 max-w-[65ch] text-sm leading-7 text-muted-foreground sm:text-base">
                                    Lihat aktivitas yang sudah terverifikasi
                                    dari program studi, tim, atau individu.
                                    Setiap angka punya dasar yang jelas, bukan
                                    ukuran nilai dirimu.
                                </p>
                            </div>
                            <div className="pointer-events-none hidden justify-center sm:flex">
                                <Mascot
                                    pose="guide"
                                    priority
                                    className="w-32 lg:w-40"
                                />
                            </div>
                        </div>
                        <div className="relative mt-5 flex min-w-0 flex-col gap-4 border-t border-white/80 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                            <p className="flex min-w-0 items-start gap-2 text-sm font-medium text-foreground">
                                <GraduationCap
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-primary"
                                />
                                <span className="[overflow-wrap:anywhere]">
                                    {leaderboard.institution?.name ?? 'Kampus'}
                                </span>
                            </p>
                            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <Button
                                    asChild
                                    variant="outline"
                                    className="min-h-11 bg-white/80"
                                >
                                    <a href="#leaderboard-method">
                                        <BookOpenCheck aria-hidden="true" />
                                        Pahami perhitungan
                                    </a>
                                </Button>
                                {!leaderboard.isCampusOperator && (
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="min-h-11 bg-white/70"
                                    >
                                        <Link href={contributionsIndex()}>
                                            Lihat kontribusi saya
                                            <ArrowRight aria-hidden="true" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </header>

                    {preferenceFeedback && (
                        <LeaderboardNotice title="Pengaturan diperbarui">
                            <p data-test="leaderboard-preference-success">
                                {preferenceFeedback}
                            </p>
                        </LeaderboardNotice>
                    )}
                    {preferenceError && preferenceIntent === null && (
                        <LeaderboardNotice
                            tone="error"
                            title="Persetujuan belum dapat dikonfirmasi"
                        >
                            <p data-test="leaderboard-preference-command-error">
                                {preferenceError}
                            </p>
                            <Button
                                variant="outline"
                                className="mt-3 min-h-11"
                                disabled={busy}
                                onClick={() => requestRows()}
                            >
                                Periksa status terbaru
                            </Button>
                        </LeaderboardNotice>
                    )}

                    <div
                        className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                        data-test="leaderboard-grid"
                    >
                        <div className="grid min-w-0 content-start gap-6">
                            <section
                                aria-labelledby="leaderboard-filter-title"
                                className="grid min-w-0 gap-5"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-primary">
                                            Konteks peringkat
                                        </p>
                                        <h2
                                            id="leaderboard-filter-title"
                                            className="mt-2 text-xl font-bold tracking-tight sm:text-2xl"
                                        >
                                            Pilih semester dan kategori.
                                        </h2>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="min-h-11"
                                        onClick={() => requestRows()}
                                        disabled={busy}
                                        data-test="leaderboard-refresh"
                                    >
                                        {isNavigating ? (
                                            <Spinner
                                                aria-hidden="true"
                                                className="motion-reduce:animate-none"
                                            />
                                        ) : (
                                            <RefreshCw aria-hidden="true" />
                                        )}
                                        Muat ulang
                                    </Button>
                                </div>
                                <div className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-6">
                                    <div className="grid min-w-0 gap-2">
                                        <label
                                            htmlFor="leaderboard-semester"
                                            className="flex items-center gap-2 text-sm font-medium"
                                        >
                                            <CalendarDays
                                                aria-hidden="true"
                                                className="size-4 shrink-0 text-primary"
                                            />
                                            Semester akademik
                                        </label>
                                        <select
                                            id="leaderboard-semester"
                                            className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                                            value={leaderboard.semester}
                                            disabled={
                                                busy ||
                                                leaderboard.semesters.length ===
                                                    0
                                            }
                                            onChange={(event) =>
                                                requestRows({
                                                    semester:
                                                        event.target.value,
                                                    scope: leaderboard.scope,
                                                    page: 1,
                                                })
                                            }
                                            data-test="leaderboard-semester-select"
                                        >
                                            {leaderboard.semesters.length ===
                                            0 ? (
                                                <option value="">
                                                    Semester belum tersedia
                                                </option>
                                            ) : (
                                                leaderboard.semesters.map(
                                                    (semester) => (
                                                        <option
                                                            key={semester.value}
                                                            value={
                                                                semester.value
                                                            }
                                                        >
                                                            {semester.label}
                                                        </option>
                                                    ),
                                                )
                                            )}
                                        </select>
                                        <p className="text-xs leading-5 text-muted-foreground">
                                            {leaderboard.semesters.length === 0
                                                ? 'Belum ada periode perhitungan yang tersedia dari kampus.'
                                                : 'Hasil selalu mengikuti semester yang dipilih, bukan total sepanjang waktu.'}
                                        </p>
                                    </div>
                                    <fieldset className="grid min-w-0 gap-3">
                                        <legend className="mb-3 text-sm font-medium">
                                            Kategori peringkat
                                        </legend>
                                        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                                            {leaderboard.scopes.map((scope) => {
                                                const selected =
                                                    scope.value ===
                                                    leaderboard.scope;
                                                const Icon =
                                                    categoryIcons[scope.value];

                                                return (
                                                    <button
                                                        key={scope.value}
                                                        type="button"
                                                        aria-pressed={selected}
                                                        disabled={busy}
                                                        onClick={() =>
                                                            requestRows({
                                                                semester:
                                                                    leaderboard.semester,
                                                                scope: scope.value,
                                                                page: 1,
                                                            })
                                                        }
                                                        className={cn(
                                                            'grid min-w-0 cursor-pointer gap-3 rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow] duration-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none',
                                                            selected
                                                                ? 'border-primary/50 bg-accent shadow-sm'
                                                                : 'border-border bg-card hover:border-primary/30 hover:bg-accent/40',
                                                        )}
                                                        data-test={
                                                            'leaderboard-scope-' +
                                                            scope.value
                                                        }
                                                    >
                                                        <span className="flex items-center justify-between gap-2">
                                                            <Icon
                                                                aria-hidden="true"
                                                                className="size-5 shrink-0 text-primary"
                                                            />
                                                            {selected && (
                                                                <Check
                                                                    aria-hidden="true"
                                                                    className="size-4 shrink-0 text-primary"
                                                                />
                                                            )}
                                                        </span>
                                                        <span className="text-sm font-semibold [overflow-wrap:anywhere]">
                                                            {scope.label}
                                                        </span>
                                                        <span className="text-xs leading-5 text-muted-foreground">
                                                            {
                                                                categoryDescriptions[
                                                                    scope.value
                                                                ]
                                                            }
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </fieldset>
                                    {individual &&
                                        !leaderboard.isCampusOperator && (
                                            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 rounded-2xl border border-primary/10 bg-accent/50 p-4">
                                                <div className="min-w-0 flex-1 text-sm leading-6">
                                                    <p className="font-semibold">
                                                        {leaderboard.preference
                                                            .isOptedIn
                                                            ? 'Persetujuan individual aktif.'
                                                            : 'Peringkat individual bersifat pilihan.'}
                                                    </p>
                                                    <p className="mt-1 text-muted-foreground">
                                                        {leaderboard.preference
                                                            .isOptedIn
                                                            ? 'Hasil mengikuti snapshot. Kamu dapat menarik persetujuan kapan saja.'
                                                            : 'Memilih kategori ini belum mengaktifkan persetujuan.'}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={openPreference}
                                                    disabled={busy}
                                                    className="min-h-11"
                                                    data-test="leaderboard-individual-settings"
                                                >
                                                    <LockKeyhole aria-hidden="true" />
                                                    Atur persetujuan
                                                </Button>
                                            </div>
                                        )}
                                </div>
                            </section>

                            {leaderboard.period?.isStale && (
                                <LeaderboardNotice
                                    tone="warning"
                                    title="Hasil menunggu perhitungan ulang"
                                >
                                    <p>
                                        Angka berasal dari snapshot{' '}
                                        {formatLeaderboardDate(
                                            leaderboard.period.computedAt,
                                        )}
                                        . Hasil dapat berubah setelah
                                        perhitungan selesai. Muat ulang untuk
                                        memeriksa status terbaru.
                                    </p>
                                </LeaderboardNotice>
                            )}
                            {loadError && (
                                <LeaderboardNotice
                                    tone="error"
                                    title="Peringkat belum diperbarui"
                                >
                                    <div className="grid justify-items-start gap-3">
                                        <p>{loadError}</p>
                                        {failedSelection && (
                                            <p className="text-xs">
                                                Pilihan yang belum diterapkan:{' '}
                                                {failedSelection.semester ||
                                                    'semester belum tersedia'}
                                                ,{' '}
                                                {leaderboard.scopes.find(
                                                    (scope) =>
                                                        scope.value ===
                                                        failedSelection?.scope,
                                                )?.label ??
                                                    'kategori peringkat'}
                                                .
                                            </p>
                                        )}
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                requestRows(failedSelection)
                                            }
                                            disabled={busy}
                                            className="min-h-11"
                                            data-test="leaderboard-retry"
                                        >
                                            {isNavigating && (
                                                <Spinner
                                                    aria-hidden="true"
                                                    className="motion-reduce:animate-none"
                                                />
                                            )}
                                            Coba lagi
                                        </Button>
                                    </div>
                                </LeaderboardNotice>
                            )}

                            <section
                                id="leaderboard-results"
                                aria-labelledby="leaderboard-results-title"
                                aria-busy={isNavigating}
                                className="grid min-w-0 gap-4"
                            >
                                <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-primary">
                                            Kontribusi terverifikasi
                                        </p>
                                        <h2
                                            id="leaderboard-results-title"
                                            className="mt-2 text-xl font-bold tracking-tight sm:text-2xl"
                                        >
                                            Peringkat{' '}
                                            {selectedCategory?.label.toLocaleLowerCase(
                                                'id-ID',
                                            ) ?? 'kampus'}
                                        </h2>
                                        <p className="mt-2 text-xs leading-5 [overflow-wrap:anywhere] text-muted-foreground">
                                            {leaderboard.semester ||
                                                'Semester belum tersedia'}
                                            .{' '}
                                            {individual
                                                ? 'Skor: total XP terverifikasi.'
                                                : 'Skor: rata-rata XP per anggota aktif.'}
                                        </p>
                                    </div>
                                    {rows && (
                                        <Badge
                                            variant="outline"
                                            className="max-w-full border-primary/10 bg-accent whitespace-normal text-primary"
                                        >
                                            {formatNumber(
                                                rows.pagination.total,
                                            )}{' '}
                                            {individual
                                                ? 'mahasiswa'
                                                : leaderboard.scope === 'team'
                                                  ? 'tim'
                                                  : 'program studi'}
                                        </Badge>
                                    )}
                                </div>
                                {isNavigating && (
                                    <LeaderboardLoading refreshing />
                                )}
                                <Deferred
                                    data="leaderboardRows"
                                    fallback={
                                        loadError ? (
                                            <></>
                                        ) : (
                                            <LeaderboardLoading />
                                        )
                                    }
                                    rescue={({ reloading }) => (
                                        <LeaderboardNotice
                                            tone="error"
                                            title="Hasil belum dapat dimuat"
                                        >
                                            <p>
                                                Data tersimpan tetap aman. Coba
                                                muat ulang.
                                            </p>
                                            <Button
                                                variant="outline"
                                                className="mt-3 min-h-11"
                                                disabled={reloading || busy}
                                                onClick={() => requestRows()}
                                                data-test="leaderboard-deferred-retry"
                                            >
                                                Muat ulang hasil
                                            </Button>
                                        </LeaderboardNotice>
                                    )}
                                >
                                    {hasRows ? (
                                        <>
                                            <LeaderboardTable
                                                rows={rows.rows}
                                                onExplain={(row) => {
                                                    explanationReturnFocus.current =
                                                        document.activeElement instanceof
                                                        HTMLElement
                                                            ? document.activeElement
                                                            : null;
                                                    setExplanationRow(row);
                                                }}
                                            />
                                            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                                                <Info
                                                    aria-hidden="true"
                                                    className="mt-0.5 size-4 shrink-0"
                                                />
                                                <span>
                                                    {individual
                                                        ? 'Hanya mahasiswa yang memberi persetujuan dan memiliki hasil perhitungan tersedia yang ditampilkan.'
                                                        : 'Skor kelompok dengan kurang dari lima anggota aktif dilindungi. Skor sama berbagi peringkat yang sama.'}{' '}
                                                    Buka penjelasan untuk
                                                    melihat dasar angkanya.
                                                </span>
                                            </p>
                                            {rows.pagination.lastPage > 1 && (
                                                <nav
                                                    aria-label="Navigasi halaman peringkat"
                                                    className="grid min-w-0 grid-cols-2 items-center gap-3 border-t border-border pt-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                                                >
                                                    <Button
                                                        variant="outline"
                                                        className="min-h-11"
                                                        disabled={
                                                            rows.pagination
                                                                .currentPage <=
                                                                1 || busy
                                                        }
                                                        onClick={() =>
                                                            requestRows({
                                                                semester:
                                                                    leaderboard.semester,
                                                                scope: leaderboard.scope,
                                                                page:
                                                                    rows
                                                                        .pagination
                                                                        .currentPage -
                                                                    1,
                                                            })
                                                        }
                                                        data-test="leaderboard-previous-page"
                                                    >
                                                        <ChevronLeft aria-hidden="true" />
                                                        Sebelumnya
                                                    </Button>
                                                    <p className="col-span-2 row-start-1 text-center font-label text-label text-xs text-muted-foreground sm:col-span-1 sm:col-start-2">
                                                        Halaman{' '}
                                                        {formatNumber(
                                                            rows.pagination
                                                                .currentPage,
                                                        )}{' '}
                                                        dari{' '}
                                                        {formatNumber(
                                                            rows.pagination
                                                                .lastPage,
                                                        )}
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        className="min-h-11"
                                                        disabled={
                                                            rows.pagination
                                                                .currentPage >=
                                                                rows.pagination
                                                                    .lastPage ||
                                                            busy
                                                        }
                                                        onClick={() =>
                                                            requestRows({
                                                                semester:
                                                                    leaderboard.semester,
                                                                scope: leaderboard.scope,
                                                                page:
                                                                    rows
                                                                        .pagination
                                                                        .currentPage +
                                                                    1,
                                                            })
                                                        }
                                                        data-test="leaderboard-next-page"
                                                    >
                                                        Berikutnya
                                                        <ChevronRight aria-hidden="true" />
                                                    </Button>
                                                </nav>
                                            )}
                                        </>
                                    ) : rows ? (
                                        <div
                                            className="grid min-w-0 justify-items-start gap-4 rounded-3xl border border-dashed border-primary/20 bg-linear-to-b from-card to-accent/40 p-6 sm:p-8"
                                            data-test={
                                                rows.emptyReason ===
                                                'opt_in_required'
                                                    ? 'leaderboard-opt-in-preview'
                                                    : 'leaderboard-empty'
                                            }
                                        >
                                            {rows.emptyReason ===
                                            'opt_in_required' ? (
                                                <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary">
                                                    <LockKeyhole
                                                        aria-hidden="true"
                                                        className="size-6"
                                                    />
                                                </span>
                                            ) : (
                                                <ArchiveArt className="w-28" />
                                            )}
                                            <h3 className="text-title font-semibold">
                                                {rows.emptyReason ===
                                                'opt_in_required'
                                                    ? 'Tentukan dulu visibilitasmu.'
                                                    : 'Belum ada hasil untuk semester ini.'}
                                            </h3>
                                            <p className="max-w-[60ch] text-sm leading-7 text-muted-foreground">
                                                {rows.emptyReason ===
                                                'opt_in_required'
                                                    ? 'Untuk membaca peringkat individual, kamu perlu menyetujui nama dan XP terverifikasimu tampil kepada mahasiswa yang memberi persetujuan di kampus yang sama. Kamu dapat membaca penjelasannya sebelum memutuskan.'
                                                    : 'Hasil muncul setelah kontribusi disetujui kampus dan perhitungan peringkat tersedia. Belum ada hasil bukan berarti kamu tidak berkontribusi.'}
                                            </p>
                                            {rows.emptyReason ===
                                                'opt_in_required' &&
                                            !leaderboard.isCampusOperator ? (
                                                <Button
                                                    onClick={openPreference}
                                                    disabled={busy}
                                                    className="min-h-11 whitespace-normal"
                                                    data-test="leaderboard-opt-in-open"
                                                >
                                                    Baca penjelasan dan atur
                                                    visibilitas
                                                    <ArrowRight aria-hidden="true" />
                                                </Button>
                                            ) : (
                                                !leaderboard.isCampusOperator && (
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        className="min-h-11"
                                                    >
                                                        <Link
                                                            href={contributionsIndex()}
                                                        >
                                                            Lihat kontribusi
                                                            saya
                                                            <ArrowRight aria-hidden="true" />
                                                        </Link>
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    ) : loadError ? null : (
                                        <LeaderboardLoading />
                                    )}
                                </Deferred>
                            </section>
                        </div>
                        <LeaderboardContext
                            data={leaderboard}
                            pending={busy}
                            savingPreference={pendingPreference}
                            onPreference={openPreference}
                        />
                    </div>
                </div>
            </AppPage>

            <Dialog
                open={preferenceIntent !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreferenceIntent(null);
                    }
                }}
            >
                <DialogContent
                    className="min-w-0 [overflow-wrap:anywhere]"
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        preferenceReturnFocus.current?.focus();
                    }}
                >
                    <DialogHeader>
                        <span className="mb-2 grid size-12 place-items-center rounded-2xl bg-accent text-primary">
                            <LockKeyhole
                                aria-hidden="true"
                                className="size-6"
                            />
                        </span>
                        <DialogTitle>
                            {preferenceIntent
                                ? 'Tampilkan peringkat individual?'
                                : 'Tarik persetujuan individual?'}
                        </DialogTitle>
                        <DialogDescription>
                            {preferenceIntent
                                ? 'Baca informasi yang akan terlihat sebelum menentukan pilihan.'
                                : 'Kamu tetap memiliki kendali atas visibilitas peringkatmu.'}
                        </DialogDescription>
                    </DialogHeader>
                    {preferenceIntent ? (
                        <div className="grid min-w-0 gap-4 text-sm leading-6">
                            <div className="rounded-2xl border border-primary/15 bg-linear-to-br from-card to-accent/60 p-4">
                                <h3 className="font-semibold">
                                    Yang akan terlihat
                                </h3>
                                <p className="mt-2 text-muted-foreground">
                                    Nama, peringkat, total XP terverifikasi, dan
                                    jumlah anggota pembagi. Dapat dibaca
                                    mahasiswa yang telah memberi persetujuan
                                    individual di{' '}
                                    {leaderboard.institution?.name ??
                                        'kampus yang sama'}
                                    .
                                </p>
                            </div>
                            <div>
                                <h3 className="flex items-center gap-2 font-semibold">
                                    <ShieldCheck
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-primary"
                                    />
                                    Data privat tetap terlindungi
                                </h3>
                                <p className="mt-2 text-muted-foreground">
                                    Bukti privat, isi diskusi, dan catatan audit
                                    tidak masuk peringkat. Pengaturan ini tidak
                                    mengubah jangkauan Portofolio.
                                </p>
                            </div>
                            <p className="border-t border-border pt-4 text-muted-foreground">
                                Kamu dapat menarik persetujuan kapan saja. Baris
                                peringkat muncul jika hasil perhitungan
                                terverifikasi sudah tersedia.
                            </p>
                        </div>
                    ) : (
                        <LeaderboardNotice title="XP dan badge tetap tersimpan">
                            <p>
                                Baris individual tidak akan ditampilkan pada
                                pembacaan berikutnya. Penarikan tidak menghapus
                                XP atau badge milikmu, dan tidak menutup akses
                                ke peringkat program studi atau tim.
                            </p>
                        </LeaderboardNotice>
                    )}
                    {preferenceError && (
                        <div
                            ref={preferenceErrorRef}
                            tabIndex={-1}
                            role="alert"
                            data-test="leaderboard-preference-error"
                            className="flex min-w-0 items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0"
                            />
                            <p>{preferenceError}</p>
                        </div>
                    )}
                    <p
                        role="status"
                        aria-live="polite"
                        className="min-h-5 text-xs leading-5 text-muted-foreground"
                        data-test="leaderboard-preference-dialog-processing"
                    >
                        {pendingPreference ? 'Menyimpan pilihanmu...' : ''}
                    </p>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" className="min-h-11">
                                {preferenceIntent
                                    ? 'Belum sekarang'
                                    : 'Tetap tampil'}
                            </Button>
                        </DialogClose>
                        <Button
                            variant={
                                preferenceIntent ? 'default' : 'destructive'
                            }
                            className="min-h-11"
                            disabled={pendingPreference}
                            onClick={() =>
                                submitPreference(preferenceIntent === true)
                            }
                            data-test={
                                preferenceIntent
                                    ? 'leaderboard-opt-in-confirm'
                                    : 'leaderboard-withdraw-confirm'
                            }
                        >
                            {pendingPreference && (
                                <Spinner
                                    aria-hidden="true"
                                    className="motion-reduce:animate-none"
                                />
                            )}
                            {preferenceIntent
                                ? 'Setujui dan tampilkan'
                                : 'Tarik persetujuan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={explanationRow !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setExplanationRow(null);
                    }
                }}
            >
                <DialogContent
                    className="min-w-0 [overflow-wrap:anywhere]"
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        explanationReturnFocus.current?.focus();
                    }}
                >
                    <DialogHeader>
                        <span className="mb-2 grid size-12 place-items-center rounded-2xl bg-accent text-primary">
                            <BookOpenCheck
                                aria-hidden="true"
                                className="size-6"
                            />
                        </span>
                        <DialogTitle>Penjelasan perhitungan</DialogTitle>
                        <DialogDescription>
                            Baca dasar angka dari snapshot server, tanpa membuka
                            data privat.
                        </DialogDescription>
                    </DialogHeader>
                    {explanationRow && (
                        <div className="grid min-w-0 gap-4">
                            <div className="rounded-2xl border border-primary/15 bg-linear-to-br from-card to-accent/60 p-4">
                                <h3 className="text-lg leading-7 font-bold tracking-tight">
                                    {explanationRow.scopeLabel ??
                                        'Nama belum tersedia'}
                                </h3>
                                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                                    {selectedCategory?.label ??
                                        'Kategori peringkat'}
                                    .{' '}
                                    {leaderboard.semester ||
                                        'Semester belum tersedia'}
                                    .
                                </p>
                                {!explanationRow.suppressed && (
                                    <p className="mt-2 text-sm font-medium">
                                        Peringkat{' '}
                                        {explanationRow.rank === null
                                            ? 'belum tersedia'
                                            : formatNumber(explanationRow.rank)}
                                        {explanationRow.sharedRankGroup !==
                                            null &&
                                            '. Peringkat sama dengan skor setara.'}
                                    </p>
                                )}
                            </div>
                            {explanationRow.suppressed ? (
                                <LeaderboardNotice
                                    tone="warning"
                                    title="Angka kelompok dilindungi"
                                >
                                    <p>
                                        {explanationRow.suppressionReason ===
                                        'cohort_below_minimum'
                                            ? 'Kelompok belum memenuhi minimum lima anggota aktif. Skor dan total XP tidak ditampilkan.'
                                            : 'Angka ditahan sampai memenuhi aturan publikasi.'}{' '}
                                        Jumlah anggota:{' '}
                                        {formatNumber(
                                            explanationRow.cohortSize,
                                        )}
                                        .
                                    </p>
                                </LeaderboardNotice>
                            ) : (
                                <>
                                    <dl className="grid min-w-0 gap-3 text-sm">
                                        {[
                                            {
                                                label:
                                                    explanationRow.scopeType ===
                                                    'individual'
                                                        ? 'Total XP (skor)'
                                                        : 'Rata-rata XP (skor)',
                                                value:
                                                    formatScore(
                                                        explanationRow.score,
                                                    ) + ' XP',
                                            },
                                            {
                                                label: 'Total XP terverifikasi',
                                                value:
                                                    formatNumber(
                                                        explanationRow.verifiedXpTotal,
                                                    ) + ' XP',
                                            },
                                            {
                                                label: 'Anggota aktif pembagi',
                                                value:
                                                    formatNumber(
                                                        explanationRow.activeMemberDenominator,
                                                    ) + ' anggota',
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                className="grid min-w-0 gap-1 border-b border-border pb-3 sm:grid-cols-2"
                                            >
                                                <dt className="text-muted-foreground">
                                                    {item.label}
                                                </dt>
                                                <dd className="min-w-0 font-label text-sm leading-6 font-semibold [overflow-wrap:anywhere] tabular-nums sm:text-right">
                                                    {item.value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                    <p className="border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
                                        {explanationRow.scopeType ===
                                        'individual'
                                            ? 'Skor individual adalah total XP terverifikasi. Tidak memakai minimum kelompok lima anggota.'
                                            : 'Total XP terverifikasi dibagi anggota aktif menghasilkan skor kelompok. Anggota aktif bukan jumlah seluruh mahasiswa kampus.'}
                                    </p>
                                </>
                            )}
                            <div className="grid min-w-0 gap-2 text-xs leading-6 text-muted-foreground">
                                <p>
                                    Versi aturan:{' '}
                                    {leaderboard.period?.ruleVersion ??
                                        'belum tersedia'}
                                    .
                                </p>
                                <p>
                                    Dihitung{' '}
                                    {formatLeaderboardDate(
                                        leaderboard.period?.computedAt ?? null,
                                    )}
                                    .
                                </p>
                                {leaderboard.period?.isStale && (
                                    <p className="font-medium text-pending-subtle-foreground">
                                        Snapshot menunggu perhitungan ulang.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" className="min-h-11">
                                Tutup penjelasan
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

LeaderboardIndex.layout = {
    breadcrumbs: [{ title: 'Peringkat', href: leaderboardsIndex() }],
};
