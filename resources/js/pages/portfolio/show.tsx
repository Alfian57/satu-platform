import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    CircleAlert,
    Eye,
    History,
    LockKeyhole,
    ShieldCheck,
    UserRoundSearch,
} from 'lucide-react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import { PortfolioEntryVisibilityControl } from '@/components/portfolio/portfolio-entry-visibility-control';
import { PortfolioVisibilitySettings } from '@/components/portfolio/portfolio-visibility-settings';
import { cn } from '@/lib/utils';
import { index as portfolioIndex } from '@/routes/portfolio';
import type {
    PortfolioEntry,
    PortfolioEntryStatus,
    PortfolioShowPageProps,
} from '@/types/portfolio';

const statusMeta: Record<
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
        description: 'Entry hanya terlihat oleh pemiliknya.',
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

function sourceStatusLabel(status: string | null): string {
    if (status === 'approved') {
        return 'Tervalidasi';
    }

    return status ?? 'Tidak tersedia';
}

function PortfolioAccessNote() {
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
                Detail ini hanya memuat data portofolio yang diizinkan. Evidence
                private, sinyal inclusion, dan audit mentah tetap berada di
                boundary masing-masing.
            </p>
        </section>
    );
}

function PortfolioProvenance({ entry }: { entry: PortfolioEntry }) {
    return (
        <section
            aria-labelledby="portfolio-provenance-title"
            className="grid gap-5 border-y border-border py-6 md:px-2"
            data-test="portfolio-provenance"
        >
            <div className="flex items-start gap-3">
                <History
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <div className="grid gap-1">
                    <h2
                        id="portfolio-provenance-title"
                        className="text-title font-bold"
                    >
                        Jejak sumber
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Status dan tingkat verifikasi mengikuti contribution
                        yang menjadi sumber entry ini.
                    </p>
                </div>
            </div>

            <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        CONTRIBUTION SUMBER
                    </dt>
                    <dd className="font-semibold">
                        Contribution #{entry.source.contribution_id}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        VERSI SUMBER
                    </dt>
                    <dd className="font-semibold">
                        {entry.source.version_number === null
                            ? 'Versi tidak tersedia'
                            : `Versi ${entry.source.version_number}`}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        TINGKAT VERIFIKASI
                    </dt>
                    <dd className="inline-flex items-center gap-2 font-semibold">
                        <ShieldCheck
                            aria-hidden="true"
                            className="size-4 text-verified"
                        />
                        {entry.verification_label}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        STATUS SUMBER
                    </dt>
                    <dd className="font-semibold">
                        {sourceStatusLabel(entry.source.status)}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        AUDIENCE ENTRY
                    </dt>
                    <dd className="font-semibold">
                        {visibilityLabels[entry.visibility]}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        PEMBARUAN TERAKHIR
                    </dt>
                    <dd className="font-semibold">
                        {formatDate(entry.updated_at)}
                    </dd>
                </div>
            </dl>

            <p className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                <UserRoundSearch
                    aria-hidden="true"
                    className="mt-0.5 size-3.5 shrink-0 text-primary"
                />
                Recruiter hanya menerima proyeksi yang diizinkan. Evidence
                private dan data audit tidak ikut diproyeksikan.
            </p>
        </section>
    );
}

export default function PortfolioShow({
    entry: initialEntry,
    profile,
    permissions,
}: PortfolioShowPageProps) {
    const [entry, setEntry] = useState(initialEntry);
    const status = statusMeta[entry.status];
    const StatusIcon = status.icon;

    return (
        <>
            <Head title={`Portofolio ${entry.id}`} />
            <AppPage
                contextRail={
                    profile && permissions.can_manage_profile ? (
                        <PortfolioVisibilitySettings profile={profile} />
                    ) : (
                        <PortfolioAccessNote />
                    )
                }
                contextRailLabel="Pengaturan portofolio"
            >
                <div className="mx-auto grid max-w-5xl min-w-0 gap-8">
                    <header className="grid gap-4 border-b border-border pb-6">
                        <Link
                            href={portfolioIndex()}
                            className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                            data-test="back-to-portfolio"
                        >
                            <ArrowLeft aria-hidden="true" className="size-4" />
                            Kembali ke portofolio
                        </Link>
                        <div className="grid gap-3">
                            <p className="font-label text-label text-primary">
                                PORTOFOLIO / ENTRY-{entry.id}
                            </p>
                            <h1 className="max-w-[28ch] text-headline font-bold text-balance break-words">
                                {entry.title}
                            </h1>
                            <p className="max-w-[68ch] text-body text-muted-foreground">
                                Detail ini merangkum pekerjaan yang berasal dari
                                contribution tersetujui, lengkap dengan jejak
                                versi dan audience yang kamu pilih.
                            </p>
                        </div>
                    </header>

                    <div
                        role="status"
                        aria-live="polite"
                        className={cn(
                            'flex items-start gap-3 border px-4 py-3 text-sm leading-6',
                            status.className,
                        )}
                        data-test="portfolio-entry-status"
                    >
                        <StatusIcon
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                        <div className="grid gap-1">
                            <p className="font-semibold">{status.label}</p>
                            <p className="text-muted-foreground">
                                {status.description}
                            </p>
                        </div>
                    </div>

                    <section
                        aria-labelledby="portfolio-summary-title"
                        className="grid gap-4 border-y border-border py-6 md:px-2"
                        data-test="portfolio-entry-summary"
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle2
                                aria-hidden="true"
                                className="size-4 text-verified"
                            />
                            <h2
                                id="portfolio-summary-title"
                                className="text-title font-bold"
                            >
                                Ringkasan pekerjaan
                            </h2>
                        </div>
                        <p className="max-w-[72ch] text-body leading-7 break-words">
                            {entry.summary}
                        </p>
                    </section>

                    <PortfolioProvenance entry={entry} />

                    {permissions.can_manage && profile && (
                        <PortfolioEntryVisibilityControl
                            entry={entry}
                            profileId={profile.id}
                            onUpdated={setEntry}
                            dataTestPrefix={`portfolio-detail-entry-${entry.id}`}
                        />
                    )}
                </div>
            </AppPage>
        </>
    );
}

PortfolioShow.layout = {
    breadcrumbs: [
        {
            title: 'Portofolio',
            href: portfolioIndex(),
        },
        {
            title: 'Detail entry',
        },
    ],
};
