import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpenCheck,
    CheckCircle2,
    CircleAlert,
    Eye,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
    UserRoundSearch,
} from 'lucide-react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import { PortfolioEntryVisibilityControl } from '@/components/portfolio/portfolio-entry-visibility-control';
import { PortfolioVisibilitySettings } from '@/components/portfolio/portfolio-visibility-settings';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
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
} from '@/types/portfolio';

const entryStatusMeta: Record<
    PortfolioEntryStatus,
    {
        label: string;
        description: string;
        className: string;
        icon: typeof CheckCircle2;
    }
> = {
    private: {
        label: 'Tersimpan privat',
        description: 'Belum dibagikan ke audience portofolio.',
        className: 'border-border bg-muted text-muted-foreground',
        icon: LockKeyhole,
    },
    published: {
        label: 'Terbit sesuai audience',
        description: 'Entry dapat ditemukan sesuai pengaturan audience.',
        className:
            'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
        icon: CheckCircle2,
    },
    withdrawn: {
        label: 'Ditarik sementara',
        description: 'Entry tidak sedang dikirim ke proyeksi recruiter.',
        className:
            'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
        icon: Eye,
    },
    source_unavailable: {
        label: 'Sumber perlu diperiksa',
        description: 'Versi contribution aktif belum tersedia.',
        className:
            'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
        icon: CircleAlert,
    },
};

const visibilityLabels: Record<PortfolioEntry['visibility'], string> = {
    private: 'Hanya saya',
    institution: 'Kampus',
    recruiter: 'Perekrut',
    public: 'Publik',
};

function formatDate(value: string | null): string {
    if (value === null) {
        return 'Belum tersedia';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Tanggal tidak tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeZone: 'UTC',
    }).format(date);
}

function PortfolioEntriesSkeleton() {
    return (
        <div
            role="region"
            aria-busy="true"
            aria-label="Daftar portofolio sedang dimuat"
            data-test="portfolio-loading"
            className="grid gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
            <p role="status" className="sr-only">
                Memuat daftar portofolio.
            </p>
            <div
                aria-hidden="true"
                className="grid gap-3 border-b border-slate-100 px-5 py-5 sm:px-6"
            >
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-6 w-2/5 max-w-xl" />
                <Skeleton className="h-4 w-3/5 max-w-2xl" />
            </div>
            {[1, 2, 3].map((row) => (
                <div
                    key={row}
                    aria-hidden="true"
                    className="grid gap-4 border-t border-slate-100 px-5 py-5 sm:px-6 md:grid-cols-[2.5rem_minmax(0,1fr)_13rem] md:items-start"
                >
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="grid gap-2">
                        <Skeleton className="h-5 w-3/5" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-2/5" />
                    </div>
                    <Skeleton className="h-9 w-32" />
                </div>
            ))}
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
            className="grid gap-4 rounded-2xl border border-correction/40 bg-correction-subtle px-5 py-8 md:px-8"
        >
            <div className="flex items-start gap-3">
                <CircleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-correction"
                />
                <div className="grid gap-1">
                    <h2 className="font-semibold">
                        Daftar portofolio belum dapat dimuat
                    </h2>
                    <p className="text-sm leading-6 text-correction-subtle-foreground">
                        Data yang tersimpan tetap aman. Coba muat ulang untuk
                        melanjutkan.
                    </p>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                className="w-fit cursor-pointer border-correction/50"
                disabled={retrying}
                onClick={onRetry}
                data-test="portfolio-error-retry"
            >
                {retrying ? <Spinner /> : <RefreshCw aria-hidden="true" />}
                Coba lagi
            </Button>
        </section>
    );
}

function PortfolioEmpty({ profile }: { profile: PortfolioProfile | null }) {
    if (profile === null) {
        return (
            <section
                data-test="portfolio-profile-missing"
                className="grid justify-items-center gap-5 rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center md:px-8"
            >
                <span className="grid size-12 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                    <ShieldCheck aria-hidden="true" className="size-6" />
                </span>
                <div className="grid gap-2">
                    <h2 className="text-title font-bold">
                        Portofolio menunggu afiliasi terverifikasi
                    </h2>
                    <p className="mx-auto max-w-[58ch] text-sm leading-6 text-muted-foreground">
                        Hubungkan akun dengan kampus dan lengkapi profil agar
                        contribution yang disetujui dapat masuk ke portofolio.
                    </p>
                </div>
                <Button asChild className="mx-auto w-fit cursor-pointer">
                    <Link href={dashboard()}>
                        Hubungkan afiliasi
                        <ArrowRight aria-hidden="true" />
                    </Link>
                </Button>
            </section>
        );
    }

    return (
        <section
            data-test="portfolio-empty"
            className="grid justify-items-center gap-5 rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center md:px-8"
        >
            <span className="grid size-12 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                <BookOpenCheck aria-hidden="true" className="size-6" />
            </span>
            <div className="grid gap-2">
                <h2 className="text-title font-bold">
                    Belum ada karya di portofolio
                </h2>
                <p className="mx-auto max-w-[58ch] text-sm leading-6 text-muted-foreground">
                    Portofolio akan bertambah setelah contribution-mu disetujui
                    reviewer kampus. Kamu tetap memegang kendali audiens-nya.
                </p>
            </div>
            <Button
                asChild
                variant="outline"
                className="mx-auto w-fit cursor-pointer"
            >
                <Link href={contributionsIndex()}>
                    Lihat contribution
                    <ArrowRight aria-hidden="true" />
                </Link>
            </Button>
        </section>
    );
}

function PortfolioLedger({
    entries,
    profile,
    canManage,
    isRefreshing,
    onRefresh,
    onEntryUpdated,
}: {
    entries: PortfolioEntry[];
    profile: PortfolioProfile;
    canManage: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
    onEntryUpdated: (entry: PortfolioEntry) => void;
}) {
    return (
        <section
            aria-labelledby="portfolio-ledger-title"
            aria-busy={isRefreshing}
            data-test="portfolio-ledger"
            className="grid gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
                <div className="grid gap-1">
                    <p className="text-xs font-bold tracking-[0.13em] text-blue-700 uppercase">
                        Rekam karya / {entries.length} item
                    </p>
                    <h2
                        id="portfolio-ledger-title"
                        className="text-title font-bold tracking-[-0.02em] text-slate-950"
                    >
                        Karya yang siap kamu kelola
                    </h2>
                    <p className="text-sm leading-6 text-slate-600">
                        Setiap karya terhubung ke sumber contribution dan
                        pilihan audiens-mu di {profile.institution.name}.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed"
                    disabled={isRefreshing}
                    onClick={onRefresh}
                    data-test="portfolio-refresh"
                >
                    {isRefreshing ? (
                        <Spinner aria-hidden="true" />
                    ) : (
                        <RefreshCw aria-hidden="true" />
                    )}
                    Segarkan karya
                </Button>
            </div>

            {isRefreshing && (
                <div
                    role="status"
                    className="flex items-center gap-2 border-y border-slate-100 bg-slate-50/70 px-5 py-3 text-sm text-slate-600 sm:px-6"
                    data-test="portfolio-refreshing"
                >
                    <RefreshCw
                        aria-hidden="true"
                        className="size-4 animate-spin motion-reduce:animate-none"
                    />
                    Memperbarui daftar. Karyamu tetap terlihat.
                </div>
            )}

            <ol className="grid">
                {entries.map((entry, index) => {
                    const status = entryStatusMeta[entry.status];
                    const StatusIcon = status.icon;

                    return (
                        <li
                            key={entry.id}
                            data-test={`portfolio-row-${entry.id}`}
                        >
                            <div className="grid gap-4 border-t border-slate-100 px-5 py-5 sm:px-6 md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(15rem,0.45fr)] md:items-start">
                                <span className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-label text-label text-slate-500">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <Link
                                    href={portfolioShow(entry.id)}
                                    className="group grid min-w-0 cursor-pointer gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                                    data-test={`portfolio-row-link-${entry.id}`}
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-label text-label text-blue-700">
                                            KARYA / VERSI{' '}
                                            {entry.source.version_number ??
                                                'versi tidak tersedia'}
                                        </span>
                                        <span
                                            className={cn(
                                                'inline-flex w-fit items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold',
                                                status.className,
                                            )}
                                        >
                                            <StatusIcon
                                                aria-hidden="true"
                                                className="size-3"
                                            />
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="grid gap-1">
                                        <span className="text-base font-bold tracking-[-0.015em] break-words text-slate-950 transition-colors duration-fast group-hover:text-blue-700">
                                            {entry.title}
                                        </span>
                                        <span className="text-sm leading-6 break-words text-slate-600">
                                            {entry.summary}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                                            <ShieldCheck
                                                aria-hidden="true"
                                                className="size-3.5 text-verified"
                                            />
                                            {entry.verification_label}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Eye
                                                aria-hidden="true"
                                                className="size-3.5 text-blue-600"
                                            />
                                            Audiens:{' '}
                                            {visibilityLabels[entry.visibility]}
                                        </span>
                                        <time dateTime={entry.updated_at}>
                                            Diperbarui{' '}
                                            {formatDate(entry.updated_at)}
                                        </time>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                                        Buka detail
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="size-4 transition-transform duration-fast group-hover:translate-x-0.5 motion-reduce:transition-none"
                                        />
                                    </span>
                                </Link>
                                {canManage && (
                                    <PortfolioEntryVisibilityControl
                                        entry={entry}
                                        profileId={profile.id}
                                        onUpdated={onEntryUpdated}
                                    />
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>

            {isRefreshing && (
                <div
                    aria-hidden="true"
                    className="grid gap-2 border-t border-slate-100 px-5 py-4 sm:px-6"
                    data-test="portfolio-refresh-skeleton"
                >
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            )}
        </section>
    );
}

function PortfolioPrivacyNote() {
    return (
        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                    <LockKeyhole aria-hidden="true" className="size-4" />
                </span>
                <div className="grid gap-1">
                    <h2 className="font-semibold">Akses tetap terkendali</h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Pengaturan portofolio muncul setelah afiliasi kampusmu
                        terverifikasi.
                    </p>
                </div>
            </div>
            <p className="border-t border-slate-100 pt-4 text-xs leading-5 text-muted-foreground">
                Data private tidak menjadi fallback publik.
            </p>
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
    const [entryOverrides, setEntryOverrides] = useState<
        Record<number, PortfolioEntry>
    >({});
    const resolvedEntries = (entries ?? []).map(
        (entry) => entryOverrides[entry.id] ?? entry,
    );

    function refresh(): void {
        setRefreshError(null);
        router.reload({
            only: ['entries'],
            onStart: () => setIsRefreshing(true),
            onFinish: () => setIsRefreshing(false),
            onError: () => {
                setRefreshError(
                    'Daftar karya belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                );
            },
        });
    }

    function updateEntry(entry: PortfolioEntry): void {
        setEntryOverrides((current) => ({ ...current, [entry.id]: entry }));
    }

    return (
        <>
            <Head title="Portofolio" />
            <AppPage
                contextRail={
                    profile && permissions.can_manage ? (
                        <PortfolioVisibilitySettings profile={profile} />
                    ) : (
                        <PortfolioPrivacyNote />
                    )
                }
                contextRailLabel="Pengaturan portofolio"
                className="min-w-0"
            >
                <div
                    className="mx-auto grid max-w-7xl min-w-0 gap-6"
                    data-test="portfolio-root"
                >
                    <header
                        className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-white px-5 py-6 sm:px-7 sm:py-7"
                        data-test="portfolio-header"
                    >
                        <div
                            aria-hidden="true"
                            className="absolute -top-28 -right-24 size-72 rounded-full bg-blue-100/70 blur-3xl"
                        />
                        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.46fr)] lg:items-stretch lg:gap-10">
                            <div className="min-w-0">
                                <p className="flex items-center gap-2 text-xs font-bold tracking-[0.13em] text-blue-700 uppercase">
                                    <span className="size-1.5 rounded-full bg-blue-600" />
                                    Portofolio mahasiswa
                                </p>
                                <h1 className="mt-4 max-w-[21ch] text-headline font-bold tracking-[-0.035em] text-balance text-slate-950">
                                    Karyamu, siap dibaca sebagai rekam jejak.
                                </h1>
                                <p className="mt-3 max-w-[66ch] text-sm leading-6 text-slate-600">
                                    Kumpulkan karya dari contribution yang
                                    tervalidasi, lalu atur sendiri siapa yang
                                    dapat melihat setiap pencapaiannya.
                                </p>
                            </div>

                            <div className="flex flex-col justify-end border-t border-slate-200 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.13em] text-slate-500 uppercase">
                                    <UserRoundSearch
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-blue-700"
                                    />
                                    Akses yang jelas
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Karyamu tampil sesuai audiens yang kamu
                                    pilih. Evidence private dan data audit tetap
                                    berada di batas aksesnya.
                                </p>
                                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                                    <div className="grid gap-1">
                                        <dt className="text-xs font-bold tracking-[0.11em] text-slate-500 uppercase">
                                            Sumber
                                        </dt>
                                        <dd className="text-sm font-semibold text-slate-900">
                                            Contribution
                                        </dd>
                                    </div>
                                    <div className="grid gap-1">
                                        <dt className="text-xs font-bold tracking-[0.11em] text-slate-500 uppercase">
                                            Kontrol
                                        </dt>
                                        <dd className="text-sm font-semibold text-slate-900">
                                            Per karya
                                        </dd>
                                    </div>
                                </dl>
                                {profile && (
                                    <p className="mt-4 text-xs font-medium text-slate-500">
                                        Kampus: {profile.institution.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </header>

                    {refreshError && (
                        <div
                            role="alert"
                            data-test="portfolio-refresh-error"
                            className="flex items-start gap-3 rounded-2xl border border-correction/40 bg-correction-subtle px-4 py-3 text-sm leading-6 text-correction-subtle-foreground"
                        >
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0"
                            />
                            <p>{refreshError}</p>
                        </div>
                    )}

                    {profile === null ? (
                        <PortfolioEmpty profile={null} />
                    ) : (
                        <Deferred
                            data="entries"
                            fallback={<PortfolioEntriesSkeleton />}
                            rescue={({ reloading }) => (
                                <PortfolioEntriesError
                                    onRetry={refresh}
                                    retrying={reloading || isRefreshing}
                                />
                            )}
                        >
                            {({ reloading }) =>
                                resolvedEntries.length === 0 ? (
                                    <PortfolioEmpty profile={profile} />
                                ) : (
                                    <PortfolioLedger
                                        entries={resolvedEntries}
                                        profile={profile}
                                        canManage={permissions.can_manage}
                                        isRefreshing={reloading || isRefreshing}
                                        onRefresh={refresh}
                                        onEntryUpdated={updateEntry}
                                    />
                                )
                            }
                        </Deferred>
                    )}
                </div>
            </AppPage>
        </>
    );
}

PortfolioIndex.layout = {
    breadcrumbs: [
        {
            title: 'Portofolio',
            href: portfolioIndex(),
        },
    ],
};
