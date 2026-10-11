import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpenCheck,
    CalendarDays,
    ChevronDown,
    CircleAlert,
    Eye,
    FileCheck2,
    FolderOpen,
    LockKeyhole,
    RefreshCw,
    Search,
    ShieldCheck,
    SlidersHorizontal,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import Mascot from '@/components/mascot';
import { PortfolioEntryVisibilityControl } from '@/components/portfolio/portfolio-entry-visibility-control';
import {
    formatPortfolioDate,
    PortfolioStatusBadge,
    portfolioStatusMeta,
    PortfolioVerificationBadge,
    portfolioVisibilityLabel,
    portfolioVisibilityOptions,
} from '@/components/portfolio/portfolio-presentation';
import { PortfolioVisibilitySettings } from '@/components/portfolio/portfolio-visibility-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard } from '@/routes';
import { index as contributionsIndex } from '@/routes/contributions';
import {
    index as portfolioIndex,
    show as portfolioShow,
} from '@/routes/portfolio';
import type {
    PortfolioEntry,
    PortfolioEntryStatus,
    PortfolioIndexPageProps,
    PortfolioProfile,
    PortfolioVisibility,
} from '@/types/portfolio';

function PortfolioEntriesSkeleton({
    refreshing = false,
}: {
    refreshing?: boolean;
}) {
    return (
        <div
            role="region"
            aria-busy="true"
            aria-label="Daftar portofolio sedang dimuat"
            data-test={
                refreshing ? 'portfolio-refresh-skeleton' : 'portfolio-loading'
            }
            className="grid min-w-0 gap-5"
        >
            <p
                role="status"
                className="flex items-center gap-2 text-sm text-muted-foreground"
            >
                <RefreshCw
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                />
                {refreshing
                    ? 'Memperbarui koleksi. Karyamu tetap terlihat.'
                    : 'Memuat koleksi portofolio.'}
            </p>
            <div
                aria-hidden="true"
                className="grid min-w-0 gap-5 2xl:grid-cols-2"
            >
                {[1, 2].map((row) => (
                    <div
                        key={row}
                        className="grid min-w-0 gap-5 rounded-3xl border border-border bg-card p-5 sm:p-7"
                    >
                        <div className="flex justify-between gap-3">
                            <Skeleton className="size-11 rounded-2xl" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function PortfolioEntriesError({
    onRetry,
    retrying,
}: {
    onRetry: () => void;
    retrying: boolean;
}) {
    return (
        <section
            role="alert"
            data-test="portfolio-error"
            className="grid min-w-0 gap-4 rounded-2xl border border-correction/30 bg-correction-subtle p-5 text-correction-subtle-foreground sm:p-6"
        >
            <div className="flex items-start gap-3">
                <CircleAlert
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0"
                />
                <div className="grid min-w-0 gap-2">
                    <h2 className="text-title font-semibold">
                        Koleksi belum dapat dimuat.
                    </h2>
                    <p className="text-sm leading-6">
                        Karya yang tersimpan tetap aman. Periksa koneksi dan
                        coba muat ulang.
                    </p>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                className="min-h-11 w-fit bg-card"
                disabled={retrying}
                onClick={onRetry}
                data-test="portfolio-error-retry"
            >
                <RefreshCw
                    aria-hidden="true"
                    className={
                        retrying
                            ? 'animate-spin motion-reduce:animate-none'
                            : ''
                    }
                />
                Coba lagi
            </Button>
        </section>
    );
}

function PortfolioEmpty({ profile }: { profile: PortfolioProfile | null }) {
    return (
        <section
            className="grid min-w-0 justify-items-center gap-4 rounded-3xl border border-dashed border-primary/20 bg-linear-to-b from-card to-accent/40 px-5 py-10 text-center sm:p-10"
            data-test={
                profile === null
                    ? 'portfolio-profile-missing'
                    : 'portfolio-empty'
            }
        >
            <ArchiveArt className="w-28" />
            <h2 className="text-title font-semibold">
                {profile === null
                    ? 'Profil portofolio belum tersedia.'
                    : 'Karya pertamamu dimulai dari kontribusi.'}
            </h2>
            <p className="max-w-[58ch] text-sm leading-7 text-muted-foreground">
                {profile === null
                    ? 'Lengkapi profil dan periksa afiliasi kampus di Beranda. Pengaturan portofolio tersedia setelah profil kampusmu siap.'
                    : 'Kontribusi yang disetujui kampus menjadi sumber karya di sini. Setelah tersedia, kamu memilih sendiri siapa yang dapat melihatnya.'}
            </p>
            <Button asChild variant="outline" className="min-h-11">
                <Link
                    href={profile === null ? dashboard() : contributionsIndex()}
                >
                    {profile === null
                        ? 'Kembali ke Beranda'
                        : 'Lihat kontribusi'}
                    <ArrowRight aria-hidden="true" />
                </Link>
            </Button>
        </section>
    );
}

function PortfolioCard({
    entry,
    profileId,
    canManage,
    onUpdated,
}: {
    entry: PortfolioEntry;
    profileId: number;
    canManage: boolean;
    onUpdated: (entry: PortfolioEntry) => void;
}) {
    return (
        <li
            className="grid min-w-0 content-start gap-5 rounded-3xl border border-border bg-card p-5 shadow-sm focus-within:border-primary/30 focus-within:shadow-md motion-safe:transition-[border-color,box-shadow] motion-safe:duration-standard sm:p-7"
            data-test={'portfolio-row-' + entry.id}
        >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                    <BookOpenCheck aria-hidden="true" className="size-5" />
                </span>
                <PortfolioStatusBadge status={entry.status} />
            </div>
            <div className="grid min-w-0 gap-3">
                <h3 className="max-w-[42ch] text-xl leading-snug font-bold tracking-tight [overflow-wrap:anywhere] sm:text-2xl">
                    <Link
                        href={portfolioShow(entry.id)}
                        className="cursor-pointer rounded-lg hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                        data-test={'portfolio-row-link-' + entry.id}
                    >
                        {entry.title}
                    </Link>
                </h3>
                <p className="line-clamp-4 max-w-[72ch] text-sm leading-7 [overflow-wrap:anywhere] text-muted-foreground sm:text-base">
                    {entry.summary}
                </p>
                <PortfolioVerificationBadge entry={entry} />
            </div>
            <dl className="grid min-w-0 gap-4 border-t border-border pt-5 text-xs sm:grid-cols-3">
                <div className="grid gap-1.5">
                    <dt className="text-muted-foreground">
                        Jangkauan tersimpan
                    </dt>
                    <dd className="flex items-center gap-1.5 font-semibold">
                        <Eye
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-primary"
                        />
                        {portfolioVisibilityLabel(entry.visibility)}
                    </dd>
                </div>
                <div className="grid gap-1.5">
                    <dt className="text-muted-foreground">Versi sumber</dt>
                    <dd className="font-semibold">
                        {entry.source.version_number === null
                            ? 'Tidak tersedia'
                            : 'Versi ' + entry.source.version_number}
                    </dd>
                </div>
                <div className="grid gap-1.5">
                    <dt className="text-muted-foreground">Diperbarui</dt>
                    <dd className="flex items-center gap-1.5 font-semibold">
                        <CalendarDays
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-primary"
                        />
                        <time dateTime={entry.updated_at}>
                            {formatPortfolioDate(entry.updated_at)}
                        </time>
                    </dd>
                </div>
            </dl>
            {canManage && (
                <details
                    className="group grid min-w-0 gap-3"
                    data-test={'portfolio-entry-' + entry.id + '-settings'}
                >
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-input bg-card px-3 py-2 text-sm font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                        <span className="flex items-center gap-2">
                            <SlidersHorizontal
                                aria-hidden="true"
                                className="size-4 shrink-0 text-primary"
                            />
                            Atur jangkauan
                        </span>
                        <ChevronDown
                            aria-hidden="true"
                            className="size-4 shrink-0 transition-[rotate] duration-fast group-open:rotate-180 motion-reduce:transition-none"
                        />
                    </summary>
                    <div className="mt-3 min-w-0">
                        <PortfolioEntryVisibilityControl
                            entry={entry}
                            profileId={profileId}
                            onUpdated={onUpdated}
                        />
                    </div>
                </details>
            )}
            <Button asChild variant="outline" className="min-h-11 w-full">
                <Link
                    href={portfolioShow(entry.id)}
                    data-test={'portfolio-detail-link-' + entry.id}
                >
                    Lihat detail karya
                    <ArrowRight aria-hidden="true" />
                </Link>
            </Button>
        </li>
    );
}

function PortfolioCollection({
    entries,
    profile,
    canManage,
    isRefreshing,
    onEntryUpdated,
}: {
    entries: PortfolioEntry[];
    profile: PortfolioProfile;
    canManage: boolean;
    isRefreshing: boolean;
    onEntryUpdated: (entry: PortfolioEntry) => void;
}) {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<PortfolioEntryStatus | 'all'>('all');
    const [visibility, setVisibility] = useState<PortfolioVisibility | 'all'>(
        'all',
    );
    const visibleEntries = useMemo(
        () =>
            entries.filter(
                (entry) =>
                    (status === 'all' || entry.status === status) &&
                    (visibility === 'all' || entry.visibility === visibility) &&
                    (entry.title + ' ' + entry.summary)
                        .toLocaleLowerCase('id-ID')
                        .includes(query.trim().toLocaleLowerCase('id-ID')),
            ),
        [entries, query, status, visibility],
    );

    return (
        <section
            aria-labelledby="portfolio-ledger-title"
            aria-busy={isRefreshing}
            data-test="portfolio-ledger"
            className="grid min-w-0 gap-5"
        >
            <div className="grid min-w-0 gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-primary">
                            Koleksi karya
                        </p>
                        <h2
                            id="portfolio-ledger-title"
                            className="mt-2 text-xl font-bold tracking-tight sm:text-2xl"
                        >
                            Rekam jejak yang kamu bangun.
                        </h2>
                    </div>
                    <p
                        role="status"
                        className="rounded-full border border-primary/10 bg-accent px-3 py-1.5 text-xs font-medium text-primary"
                    >
                        {visibleEntries.length} dari {entries.length} karya
                    </p>
                </div>
                <div className="grid min-w-0 gap-4 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-6">
                    <div className="grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_11rem_9rem]">
                        <div className="grid min-w-0 gap-2 sm:col-span-2 2xl:col-span-1">
                            <Label htmlFor="portfolio-search">Cari karya</Label>
                            <div className="relative min-w-0">
                                <Search
                                    aria-hidden="true"
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                />
                                <Input
                                    id="portfolio-search"
                                    className="h-11 pl-9"
                                    placeholder="Cari judul atau ringkasan"
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid min-w-0 gap-2">
                            <Label htmlFor="portfolio-status-filter">
                                Status berbagi
                            </Label>
                            <select
                                id="portfolio-status-filter"
                                className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:text-sm"
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target.value as
                                            PortfolioEntryStatus | 'all',
                                    )
                                }
                            >
                                <option value="all">Semua status</option>
                                {Object.entries(portfolioStatusMeta).map(
                                    ([value, meta]) => (
                                        <option key={value} value={value}>
                                            {meta.label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                        <div className="grid min-w-0 gap-2">
                            <Label htmlFor="portfolio-visibility-filter">
                                Jangkauan karya
                            </Label>
                            <select
                                id="portfolio-visibility-filter"
                                className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:text-sm"
                                value={visibility}
                                onChange={(event) =>
                                    setVisibility(
                                        event.target.value as
                                            PortfolioVisibility | 'all',
                                    )
                                }
                            >
                                <option value="all">Semua jangkauan</option>
                                {portfolioVisibilityOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                        Pencarian hanya pada karya yang tersedia di daftar ini.
                        Urutan mengikuti pembaruan terakhir.
                    </p>
                </div>
            </div>
            {isRefreshing && <PortfolioEntriesSkeleton refreshing />}
            {entries.length === 0 ? (
                <PortfolioEmpty profile={profile} />
            ) : visibleEntries.length === 0 ? (
                <div
                    data-test="portfolio-no-matches"
                    className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-6 text-center"
                >
                    <Search
                        aria-hidden="true"
                        className="size-8 text-primary"
                    />
                    <h3 className="text-title font-semibold">
                        Belum ada karya yang cocok.
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Coba kata kunci atau pilihan filter lainnya.
                    </p>
                    <Button
                        variant="outline"
                        className="min-h-11"
                        onClick={() => {
                            setQuery('');
                            setStatus('all');
                            setVisibility('all');
                        }}
                    >
                        Atur ulang pencarian
                    </Button>
                </div>
            ) : (
                <ol className="grid min-w-0 gap-5 2xl:grid-cols-2">
                    {visibleEntries.map((entry) => (
                        <PortfolioCard
                            key={entry.id}
                            entry={entry}
                            profileId={profile.id}
                            canManage={canManage}
                            onUpdated={onEntryUpdated}
                        />
                    ))}
                </ol>
            )}
        </section>
    );
}

function PortfolioPrivacyNote() {
    return (
        <section className="grid min-w-0 gap-4 border-t border-border px-1 pt-5">
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <LockKeyhole aria-hidden="true" className="size-5" />
                </span>
                <div className="grid gap-2">
                    <h2 className="text-title font-semibold">
                        Akses tetap terkendali.
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Pengaturan tersedia bagi pemilik profil kampus yang siap
                        digunakan. Data privat tidak ditampilkan sebagai
                        pengganti.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default function PortfolioIndex({
    profile,
    permissions,
    entries,
}: PortfolioIndexPageProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [entryOverrides, setEntryOverrides] = useState<
        Record<number, PortfolioEntry>
    >({});
    const [profileOverride, setProfileOverride] =
        useState<PortfolioProfile | null>(null);
    const resolvedProfile =
        profile &&
        profileOverride?.id === profile.id &&
        profileOverride.updated_at >= profile.updated_at
            ? profileOverride
            : profile;
    const resolvedEntries = (entries ?? []).map((entry) =>
        entryOverrides[entry.id] &&
        entryOverrides[entry.id].updated_at >= entry.updated_at
            ? entryOverrides[entry.id]
            : entry,
    );

    function refresh(): void {
        if (isRefreshing) {
            return;
        }

        setRefreshError(null);
        setIsRefreshing(true);
        router.reload({
            only: ['entries', 'profile', 'permissions'],
            onSuccess: () => {
                setRefreshError(null);
                setIsForbidden(false);
                setEntryOverrides({});
                setProfileOverride(null);
            },
            onError: () =>
                setRefreshError(
                    'Koleksi belum diperbarui. Karya tersimpan tetap aman. Coba lagi.',
                ),
            onHttpException: (response) => {
                if (response.status === 403) {
                    setIsForbidden(true);
                }

                setRefreshError(
                    response.status === 403
                        ? 'Akses portofolio tidak tersedia saat ini. Periksa afiliasi kampus atau coba muat ulang.'
                        : 'Koleksi belum diperbarui. Karya tersimpan tetap aman. Coba lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setRefreshError(
                    'Koleksi belum diperbarui. Karya yang terlihat tetap tersimpan. Periksa koneksi dan coba lagi.',
                );

                return false;
            },
            onFinish: () => setIsRefreshing(false),
        });
    }

    return (
        <>
            <Head title="Portofolio" />
            <AppPage>
                <div
                    className="grid w-full min-w-0 gap-6"
                    data-test="portfolio-root"
                >
                    <header
                        className="relative overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent via-sky-100 to-blue-100 p-5 shadow-md sm:p-7"
                        data-test="portfolio-header"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-24 -right-12 size-80 rounded-full border border-white/70 bg-white/30"
                        />
                        <ArchiveArt className="absolute top-5 right-28 hidden w-36 -rotate-6 opacity-55 sm:block lg:right-36 lg:w-44" />
                        <span
                            aria-hidden="true"
                            className="absolute top-7 right-7 h-1.5 w-10 -rotate-12 rounded-full bg-satu-feather/70"
                        />
                        <div className="relative flex min-w-0 items-center justify-between gap-4">
                            <div className="max-w-2xl min-w-0">
                                <p className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary">
                                    <BookOpenCheck
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    Portofolio mahasiswa
                                </p>
                                <h1 className="mt-4 text-2xl leading-snug font-bold tracking-tight sm:text-3xl">
                                    Karya yang bercerita tentang perjalananmu.
                                </h1>
                                <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                                    Lihat hasil kontribusimu, kenali jejak
                                    verifikasinya, dan tentukan siapa yang boleh
                                    melihat karya yang kamu bangun.
                                </p>
                            </div>
                            <Mascot
                                pose="guide"
                                priority
                                className="hidden w-32 shrink-0 sm:block lg:w-40"
                            />
                        </div>
                        <div className="relative mt-5 flex min-w-0 flex-col gap-4 border-t border-white/80 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                            <p className="flex min-w-0 items-start gap-2 text-sm leading-6">
                                <FolderOpen
                                    aria-hidden="true"
                                    className="mt-1 size-4 shrink-0 text-primary"
                                />
                                <span className="[overflow-wrap:anywhere]">
                                    {!isForbidden && resolvedProfile
                                        ? resolvedProfile.institution.name
                                        : 'Karya dari kontribusi yang disetujui kampus'}
                                </span>
                            </p>
                            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                                {!isForbidden &&
                                    resolvedProfile &&
                                    permissions.can_manage && (
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="min-h-11 bg-card"
                                        >
                                            <a
                                                href="#portfolio-profile-title"
                                                data-test="portfolio-profile-jump"
                                            >
                                                <Eye aria-hidden="true" />
                                                Kendali profil
                                            </a>
                                        </Button>
                                    )}
                                {!isForbidden && profile && (
                                    <Button
                                        asChild
                                        className="min-h-11 hover:bg-primary dark:hover:bg-primary"
                                    >
                                        <Link href={contributionsIndex()}>
                                            Lihat kontribusi
                                            <ArrowRight aria-hidden="true" />
                                        </Link>
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="min-h-11 bg-card"
                                    onClick={refresh}
                                    disabled={isRefreshing}
                                    data-test="portfolio-refresh"
                                >
                                    <RefreshCw
                                        aria-hidden="true"
                                        className={
                                            isRefreshing
                                                ? 'animate-spin motion-reduce:animate-none'
                                                : ''
                                        }
                                    />
                                    Muat ulang
                                </Button>
                            </div>
                        </div>
                    </header>
                    {refreshError && (
                        <div
                            role="alert"
                            data-test="portfolio-refresh-error"
                            className="flex items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground"
                        >
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0"
                            />
                            <p>{refreshError}</p>
                        </div>
                    )}
                    {!isForbidden && (
                        <div
                            className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                            data-test="portfolio-grid"
                        >
                            <div className="grid min-w-0 content-start gap-5">
                                {resolvedProfile === null ? (
                                    <PortfolioEmpty profile={null} />
                                ) : (
                                    <Deferred
                                        data="entries"
                                        fallback={<PortfolioEntriesSkeleton />}
                                        rescue={({ reloading }) => (
                                            <PortfolioEntriesError
                                                onRetry={refresh}
                                                retrying={
                                                    reloading || isRefreshing
                                                }
                                            />
                                        )}
                                    >
                                        {({ reloading }) => (
                                            <PortfolioCollection
                                                entries={resolvedEntries}
                                                profile={resolvedProfile}
                                                canManage={
                                                    permissions.can_manage
                                                }
                                                isRefreshing={
                                                    reloading || isRefreshing
                                                }
                                                onEntryUpdated={(entry) =>
                                                    setEntryOverrides(
                                                        (current) => ({
                                                            ...current,
                                                            [entry.id]: entry,
                                                        }),
                                                    )
                                                }
                                            />
                                        )}
                                    </Deferred>
                                )}
                            </div>
                            <aside
                                className="grid min-w-0 content-start gap-5"
                                aria-label="Pengaturan portofolio"
                            >
                                {resolvedProfile && permissions.can_manage ? (
                                    <PortfolioVisibilitySettings
                                        key={resolvedProfile.id}
                                        profile={resolvedProfile}
                                        onUpdated={setProfileOverride}
                                    />
                                ) : (
                                    <PortfolioPrivacyNote />
                                )}
                                <section className="grid min-w-0 gap-4 border-t border-border px-1 pt-5">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <FileCheck2
                                            aria-hidden="true"
                                            className="size-4 shrink-0 text-primary"
                                        />
                                        Karya punya sumber yang jelas.
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Karya berasal dari kontribusi yang
                                        disetujui kampus. Verifikasi tidak
                                        otomatis membuatnya terbuka untuk semua
                                        orang.
                                    </p>
                                    <p className="flex items-start gap-2 border-t border-primary/10 pt-4 text-xs leading-5 text-muted-foreground">
                                        <ShieldCheck
                                            aria-hidden="true"
                                            className="mt-0.5 size-4 shrink-0"
                                        />
                                        Bukti privat dan catatan kampus tidak
                                        ikut ditampilkan di portofolio publik.
                                    </p>
                                </section>
                            </aside>
                        </div>
                    )}
                </div>
            </AppPage>
        </>
    );
}

PortfolioIndex.layout = {
    breadcrumbs: [{ title: 'Portofolio', href: portfolioIndex() }],
};
