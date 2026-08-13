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
import { index as contributionsIndex } from '@/routes/contributions';
import { show as onboarding } from '@/routes/onboarding';
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
        description: 'Belum dibagikan ke audience portfolio.',
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
    recruiter: 'Recruiter',
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
            aria-label="Daftar portfolio sedang dimuat"
            data-test="portfolio-loading"
            className="grid gap-0 border-y border-border"
        >
            <p role="status" className="sr-only">
                Memuat daftar portfolio.
            </p>
            <div aria-hidden="true" className="grid gap-3 px-4 py-5 md:px-6">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-7 w-3/5 max-w-xl" />
                <Skeleton className="h-4 w-4/5 max-w-2xl" />
            </div>
            {[1, 2, 3].map((row) => (
                <div
                    key={row}
                    aria-hidden="true"
                    className="grid gap-4 border-t border-border px-4 py-5 md:grid-cols-[2rem_minmax(0,1fr)_13rem] md:items-center md:px-6"
                >
                    <Skeleton className="h-4 w-7" />
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
            className="grid gap-4 border-y border-correction/40 bg-correction-subtle px-4 py-8 md:px-8"
        >
            <div className="flex items-start gap-3">
                <CircleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-correction"
                />
                <div className="grid gap-1">
                    <h2 className="font-semibold">
                        Daftar portfolio belum dapat dimuat
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
                className="grid gap-5 border-y border-border px-4 py-12 text-center md:px-8"
            >
                <ShieldCheck
                    aria-hidden="true"
                    className="mx-auto size-9 text-primary"
                />
                <div className="grid gap-2">
                    <h2 className="text-title font-bold">
                        Portfolio menunggu afiliasi terverifikasi
                    </h2>
                    <p className="mx-auto max-w-[58ch] text-sm leading-6 text-muted-foreground">
                        Hubungkan akun dengan kampus dan lengkapi profil agar
                        contribution yang disetujui dapat masuk ke portfolio.
                    </p>
                </div>
                <Button asChild className="mx-auto w-fit cursor-pointer">
                    <Link href={onboarding()}>
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
            className="grid gap-5 border-y border-border px-4 py-12 text-center md:px-8"
        >
            <BookOpenCheck
                aria-hidden="true"
                className="mx-auto size-9 text-primary"
            />
            <div className="grid gap-2">
                <h2 className="text-title font-bold">
                    Belum ada entry portfolio
                </h2>
                <p className="mx-auto max-w-[58ch] text-sm leading-6 text-muted-foreground">
                    Portfolio akan bertambah setelah contribution-mu disetujui
                    reviewer kampus. Kamu tetap memegang kendali audience-nya.
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
            className="grid gap-4"
        >
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="grid gap-1">
                    <h2
                        id="portfolio-ledger-title"
                        className="text-title font-bold"
                    >
                        Ledger portfolio
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {entries.length} entry dengan provenance yang dapat
                        ditinjau di {profile.institution.name}.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer disabled:cursor-not-allowed"
                    disabled={isRefreshing}
                    onClick={onRefresh}
                    data-test="portfolio-refresh"
                >
                    {isRefreshing ? (
                        <Spinner aria-hidden="true" />
                    ) : (
                        <RefreshCw aria-hidden="true" />
                    )}
                    Segarkan ledger
                </Button>
            </div>

            {isRefreshing && (
                <div
                    role="status"
                    className="flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                    data-test="portfolio-refreshing"
                >
                    <RefreshCw
                        aria-hidden="true"
                        className="size-4 animate-spin motion-reduce:animate-none"
                    />
                    Menyegarkan entry tanpa menghapus data yang sedang terlihat.
                </div>
            )}

            <ol className="divide-y divide-border border-y border-border">
                {entries.map((entry, index) => {
                    const status = entryStatusMeta[entry.status];
                    const StatusIcon = status.icon;

                    return (
                        <li
                            key={entry.id}
                            data-test={`portfolio-row-${entry.id}`}
                        >
                            <div className="grid gap-4 px-4 py-5 md:grid-cols-[2rem_minmax(0,1fr)_minmax(16rem,0.45fr)] md:items-start md:px-6">
                                <span className="font-label text-label text-muted-foreground">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <Link
                                    href={portfolioShow(entry.id)}
                                    className="group grid min-w-0 cursor-pointer gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                                    data-test={`portfolio-row-link-${entry.id}`}
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-label text-label text-primary">
                                            CONTRIBUTION / VERSI{' '}
                                            {entry.source.version_number ??
                                                'versi tidak tersedia'}
                                        </span>
                                        <span
                                            className={cn(
                                                'inline-flex w-fit items-center gap-1.5 border px-2 py-1 text-xs font-semibold',
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
                                        <span className="text-base font-bold break-words group-hover:text-primary">
                                            {entry.title}
                                        </span>
                                        <span className="text-sm leading-6 break-words text-muted-foreground">
                                            {entry.summary}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1.5">
                                            <ShieldCheck
                                                aria-hidden="true"
                                                className="size-3.5 text-verified"
                                            />
                                            {entry.verification_label}
                                        </span>
                                        <span>
                                            Audience:{' '}
                                            {visibilityLabels[entry.visibility]}
                                        </span>
                                        <time dateTime={entry.updated_at}>
                                            Diperbarui{' '}
                                            {formatDate(entry.updated_at)}
                                        </time>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
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
                    className="grid gap-2 border-b border-border px-4 py-4 md:px-6"
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
        <section className="grid gap-4 border-y border-border py-5">
            <div className="flex items-center gap-2">
                <LockKeyhole
                    aria-hidden="true"
                    className="size-4 text-primary"
                />
                <h2 className="font-semibold">Batas akses</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
                Pengaturan portfolio muncul setelah afiliasi kampusmu
                terverifikasi. Data private tidak menjadi fallback publik.
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
                    'Ledger belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                );
            },
        });
    }

    function updateEntry(entry: PortfolioEntry): void {
        setEntryOverrides((current) => ({ ...current, [entry.id]: entry }));
    }

    return (
        <>
            <Head title="Portfolio" />
            <AppPage
                contextRail={
                    profile && permissions.can_manage ? (
                        <PortfolioVisibilitySettings profile={profile} />
                    ) : (
                        <PortfolioPrivacyNote />
                    )
                }
                contextRailLabel="Pengaturan privacy portfolio"
                className="min-w-0"
            >
                <div className="mx-auto grid max-w-7xl min-w-0 gap-8">
                    <header className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.4fr)] lg:items-end lg:gap-10">
                        <div className="min-w-0 space-y-3">
                            <p className="font-label text-label text-primary">
                                PORTFOLIO / PROVENANCE MAHASISWA
                            </p>
                            <h1 className="max-w-[24ch] text-headline font-bold text-balance">
                                Pekerjaan nyata, tersusun sebagai bukti yang
                                dapat ditinjau.
                            </h1>
                            <p className="max-w-[68ch] text-body text-muted-foreground">
                                Setiap entry berasal dari contribution yang
                                sudah memiliki jejak versi dan tingkat
                                verifikasi. Kamu memilih audience-nya tanpa
                                membuka evidence private.
                            </p>
                        </div>

                        <div className="grid gap-3 border border-border bg-card/60 px-4 py-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <UserRoundSearch
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-primary"
                                />
                                <span className="font-label text-label">
                                    PROYEKSI RECRUITER
                                </span>
                            </div>
                            <p className="text-sm leading-6">
                                Recruiter hanya melihat entry yang kamu izinkan
                                dan sudah lolos boundary projection.
                            </p>
                            {profile && (
                                <p className="font-label text-label text-muted-foreground">
                                    TENANT: {profile.institution.name}
                                </p>
                            )}
                        </div>
                    </header>

                    {refreshError && (
                        <div
                            role="alert"
                            data-test="portfolio-refresh-error"
                            className="flex items-start gap-3 border border-correction/40 bg-correction-subtle px-4 py-3 text-sm leading-6 text-correction-subtle-foreground"
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
            title: 'Portfolio',
            href: portfolioIndex(),
        },
    ],
};
