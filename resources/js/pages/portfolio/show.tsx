import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpenCheck,
    CircleAlert,
    FileText,
    History,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import { PortfolioEntryVisibilityControl } from '@/components/portfolio/portfolio-entry-visibility-control';
import {
    formatPortfolioDate,
    PortfolioStatusBadge,
    portfolioStatusMeta,
    PortfolioVerificationBadge,
    portfolioVisibilityLabel,
} from '@/components/portfolio/portfolio-presentation';
import { PortfolioVisibilitySettings } from '@/components/portfolio/portfolio-visibility-settings';
import { Button } from '@/components/ui/button';
import { index as portfolioIndex } from '@/routes/portfolio';
import type {
    PortfolioEntry,
    PortfolioProfile,
    PortfolioShowPageProps,
} from '@/types/portfolio';

function sourceStatusLabel(status: string | null): string {
    const labels: Record<string, string> = {
        draft: 'Draft',
        pending: 'Menunggu validasi',
        revision: 'Perlu diperbaiki',
        approved: 'Tervalidasi',
        rejected: 'Ditolak',
        archived: 'Diarsipkan',
    };

    return status === null
        ? 'Tidak tersedia'
        : (labels[status] ?? 'Tidak tersedia');
}

function PortfolioAccessNote() {
    return (
        <section className="grid min-w-0 gap-4 border-t border-border px-1 pt-5">
            <div className="flex items-start gap-3">
                <LockKeyhole
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-primary"
                />
                <div className="grid gap-2">
                    <h2 className="text-title font-semibold">
                        Informasi yang diizinkan.
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Kamu membaca rincian karya yang tersedia sesuai izin
                        akses. Pengaturan jangkauan tetap dikelola pemilik.
                    </p>
                </div>
            </div>
        </section>
    );
}

function PortfolioProvenance({ entry }: { entry: PortfolioEntry }) {
    const facts = [
        {
            label: 'Kontribusi sumber',
            value: 'Kontribusi #' + entry.source.contribution_id,
        },
        {
            label: 'Versi sumber',
            value:
                entry.source.version_number === null
                    ? 'Tidak tersedia'
                    : 'Versi ' + entry.source.version_number,
        },
        {
            label: 'Status sumber',
            value: sourceStatusLabel(entry.source.status),
        },
        {
            label: 'Jangkauan karya',
            value: portfolioVisibilityLabel(entry.visibility),
        },
        {
            label: 'Diterbitkan',
            value: formatPortfolioDate(entry.published_at),
        },
        {
            label: 'Pembaruan terakhir',
            value: formatPortfolioDate(entry.updated_at),
        },
    ];

    return (
        <section
            aria-labelledby="portfolio-provenance-title"
            className="grid min-w-0 gap-5 border-t border-border px-1 pt-6"
            data-test="portfolio-provenance"
        >
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <History aria-hidden="true" className="size-5" />
                </span>
                <div className="grid gap-1">
                    <h2
                        id="portfolio-provenance-title"
                        className="text-title font-semibold"
                    >
                        Jejak di balik karya.
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Karya tetap terhubung ke versi kontribusi yang menjadi
                        sumbernya.
                    </p>
                </div>
            </div>
            <PortfolioVerificationBadge entry={entry} />
            <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
                {facts.map((fact) => (
                    <div
                        key={fact.label}
                        className="grid min-w-0 gap-2 border-t border-border/70 pt-4"
                    >
                        <dt className="text-xs text-muted-foreground">
                            {fact.label}
                        </dt>
                        <dd className="text-sm font-semibold [overflow-wrap:anywhere]">
                            {fact.value}
                        </dd>
                    </div>
                ))}
            </dl>
            {entry.withdrawn_at && (
                <p className="rounded-2xl border border-pending/30 bg-pending-subtle p-4 text-sm leading-6 text-pending-subtle-foreground">
                    Karya ditarik pada{' '}
                    <time dateTime={entry.withdrawn_at}>
                        {formatPortfolioDate(entry.withdrawn_at)}
                    </time>
                    . Periksa pengaturan jangkauan sebelum membagikannya
                    kembali.
                </p>
            )}
            <p className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                />
                Verifikasi dan jangkauan adalah dua hal berbeda. Bukti privat
                dan catatan kampus tidak ikut dibagikan.
            </p>
        </section>
    );
}

export default function PortfolioShow({
    entry: initialEntry,
    profile,
    permissions,
}: PortfolioShowPageProps) {
    const [entryOverride, setEntryOverride] = useState<PortfolioEntry | null>(
        null,
    );
    const [profileOverride, setProfileOverride] =
        useState<PortfolioProfile | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const entry =
        entryOverride?.id === initialEntry.id &&
        entryOverride.updated_at >= initialEntry.updated_at
            ? entryOverride
            : initialEntry;
    const resolvedProfile =
        profile &&
        profileOverride?.id === profile.id &&
        profileOverride.updated_at >= profile.updated_at
            ? profileOverride
            : profile;

    function refresh(): void {
        if (isRefreshing) {
            return;
        }

        setRefreshError(null);
        setIsRefreshing(true);
        router.reload({
            only: ['entry', 'profile', 'permissions'],
            onSuccess: () => {
                setRefreshError(null);
                setIsForbidden(false);
                setEntryOverride(null);
                setProfileOverride(null);
            },
            onError: () =>
                setRefreshError(
                    'Detail belum diperbarui. Karya tersimpan tetap aman. Coba lagi.',
                ),
            onHttpException: (response) => {
                if (response.status === 403) {
                    setIsForbidden(true);
                }

                setRefreshError(
                    response.status === 403
                        ? 'Akses karya ini sudah tidak tersedia. Kembali ke Portofolio atau coba muat ulang.'
                        : 'Detail belum diperbarui. Karya tersimpan tetap aman. Coba lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setRefreshError(
                    'Detail belum diperbarui. Karya tersimpan tetap aman. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
            onFinish: () => setIsRefreshing(false),
        });
    }

    return (
        <>
            <Head
                title={isForbidden ? 'Portofolio' : 'Portofolio ' + entry.id}
            />
            <AppPage>
                <div
                    className="grid w-full min-w-0 gap-6"
                    data-test="portfolio-detail-root"
                >
                    <header
                        className="relative grid min-w-0 gap-4 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent via-sky-100 to-blue-100 p-5 shadow-md sm:p-7"
                        data-test="portfolio-detail-header"
                    >
                        <ArchiveArt className="absolute right-8 bottom-5 hidden w-36 -rotate-6 opacity-65 lg:block" />
                        <div className="relative flex min-w-0 flex-wrap items-center justify-between gap-3">
                            <Link
                                href={portfolioIndex()}
                                className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-xl text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                data-test="back-to-portfolio"
                            >
                                <ArrowLeft
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Kembali ke portofolio
                            </Link>
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-11 bg-card"
                                onClick={refresh}
                                disabled={isRefreshing}
                                data-test="portfolio-detail-refresh"
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
                        <div className="relative grid min-w-0 gap-3 lg:pr-48">
                            <p className="font-label text-label text-primary">
                                {isForbidden
                                    ? 'Portofolio'
                                    : 'Portofolio / Karya-' + entry.id}
                            </p>
                            <h1 className="max-w-[36ch] text-2xl leading-tight font-bold [overflow-wrap:anywhere] sm:text-3xl lg:text-4xl">
                                {isForbidden
                                    ? 'Akses karya tidak tersedia.'
                                    : entry.title}
                            </h1>
                            {!isForbidden && (
                                <>
                                    <p className="max-w-[72ch] text-sm leading-7 text-muted-foreground sm:text-base">
                                        Hasil pekerjaanmu, dengan jejak sumber
                                        dan pengaturan berbagi yang tetap
                                        terkendali.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <PortfolioStatusBadge
                                            status={entry.status}
                                        />
                                        <PortfolioVerificationBadge
                                            entry={entry}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </header>
                    {refreshError && (
                        <div
                            role="alert"
                            data-test="portfolio-detail-refresh-error"
                            className="flex items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground"
                        >
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0"
                            />
                            <p>{refreshError}</p>
                        </div>
                    )}
                    {isRefreshing && (
                        <p
                            role="status"
                            aria-busy="true"
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                            <RefreshCw
                                aria-hidden="true"
                                className="size-4 animate-spin motion-reduce:animate-none"
                            />
                            Memperbarui detail karya.
                        </p>
                    )}
                    {!isForbidden && (
                        <div
                            className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                            data-test="portfolio-detail-grid"
                        >
                            <div className="grid min-w-0 content-start gap-5">
                                <section
                                    aria-labelledby="portfolio-state-title"
                                    className="grid min-w-0 gap-3 border-t border-border px-1 pt-5"
                                    data-test="portfolio-entry-status"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                                            <BookOpenCheck
                                                aria-hidden="true"
                                                className="size-5"
                                            />
                                        </span>
                                        <h2
                                            id="portfolio-state-title"
                                            className="text-title font-semibold"
                                        >
                                            Status berbagi karya
                                        </h2>
                                    </div>
                                    <PortfolioStatusBadge
                                        status={entry.status}
                                    />
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        {
                                            portfolioStatusMeta[entry.status]
                                                .description
                                        }
                                    </p>
                                </section>
                                {permissions.can_manage && resolvedProfile && (
                                    <PortfolioEntryVisibilityControl
                                        entry={entry}
                                        profileId={resolvedProfile.id}
                                        onUpdated={setEntryOverride}
                                        dataTestPrefix={`portfolio-detail-entry-${entry.id}`}
                                    />
                                )}
                                <section
                                    aria-labelledby="portfolio-summary-title"
                                    className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-7"
                                    data-test="portfolio-entry-summary"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                                            <FileText
                                                aria-hidden="true"
                                                className="size-5"
                                            />
                                        </span>
                                        <div>
                                            <p className="text-xs font-semibold text-primary">
                                                Cerita pekerjaan
                                            </p>
                                            <h2
                                                id="portfolio-summary-title"
                                                className="mt-1 text-xl font-bold tracking-tight sm:text-2xl"
                                            >
                                                Ringkasan karya
                                            </h2>
                                        </div>
                                    </div>
                                    <p className="max-w-[72ch] text-base leading-8 [overflow-wrap:anywhere] whitespace-pre-wrap">
                                        {entry.summary ||
                                            'Ringkasan karya belum tersedia.'}
                                    </p>
                                </section>
                                <PortfolioProvenance entry={entry} />
                            </div>
                            <aside
                                className="grid min-w-0 content-start gap-5"
                                aria-label="Pengaturan profil dan batas berbagi"
                            >
                                {resolvedProfile &&
                                permissions.can_manage_profile ? (
                                    <PortfolioVisibilitySettings
                                        key={resolvedProfile.id}
                                        profile={resolvedProfile}
                                        onUpdated={setProfileOverride}
                                    />
                                ) : (
                                    <PortfolioAccessNote />
                                )}
                                <div className="flex items-start gap-3 border-t border-border px-1 pt-5 text-sm leading-6 text-muted-foreground">
                                    <ShieldCheck
                                        aria-hidden="true"
                                        className="mt-1 size-5 shrink-0 text-primary"
                                    />
                                    <p>
                                        Pengaturan profil tidak menggantikan
                                        jangkauan setiap karya. Publikasi juga
                                        tidak otomatis memberi akses kepada
                                        perekrut.
                                    </p>
                                </div>
                            </aside>
                        </div>
                    )}
                </div>
            </AppPage>
        </>
    );
}

PortfolioShow.layout = {
    breadcrumbs: [
        { title: 'Portofolio', href: portfolioIndex() },
        { title: 'Detail karya' },
    ],
};
