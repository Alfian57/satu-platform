import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpenCheck,
    CircleAlert,
    History,
    Globe2,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import { PortfolioVerificationBadge } from '@/components/portfolio/portfolio-presentation';
import { home } from '@/routes';
import type {
    PortfolioVerificationLevel,
    PublicPortfolioEntry,
    PublicPortfolioPageProps,
    PublicPortfolioProfile,
} from '@/types/portfolio';

const verificationDescriptions: Record<PortfolioVerificationLevel, string> = {
    self_reported: 'Catatan pekerjaan yang dinyatakan oleh pemilik portofolio.',
    team_confirmed: 'Kontribusi yang dikonfirmasi oleh rekan satu tim.',
    institution_verified: 'Kontribusi yang disetujui melalui validasi kampus.',
};

function formatDate(value: string | null): string {
    if (value === null) {
        return 'Tanggal tidak tersedia';
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

function PublicHeader() {
    return (
        <header className="border-b border-border bg-card/90">
            <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
                <Link
                    href={home()}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    data-test="public-portfolio-brand"
                >
                    <AppLogo
                        compact
                        className="text-primary"
                        logoClassName="size-10 rounded-none shadow-none"
                    />
                    <span className="hidden text-sm text-muted-foreground sm:inline">
                        Buku Besar Kolaborasi
                    </span>
                </Link>
                <p className="text-xs font-medium text-muted-foreground">
                    Portofolio publik
                </p>
            </div>
        </header>
    );
}

function PublicFooter() {
    return (
        <footer className="border-t border-border">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-6 lg:px-8">
                <p>SATU. Karya nyata, dibagikan dengan kendali pemilik.</p>
                <Link
                    href={home()}
                    className="inline-flex min-h-11 w-fit cursor-pointer items-center rounded-xl font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                    Pelajari SATU
                    <span aria-hidden="true">
                        {' '}
                        <ArrowRight className="inline size-3.5" />
                    </span>
                </Link>
            </div>
        </footer>
    );
}

function ProjectionBoundary({ profile }: { profile: PublicPortfolioProfile }) {
    return (
        <aside
            aria-labelledby="public-boundary-title"
            className="grid min-w-0 gap-4 rounded-2xl border border-white/80 bg-white/75 p-5 shadow-sm sm:p-6"
            data-test="public-projection-boundary"
        >
            <div className="flex items-center gap-2">
                <BookOpenCheck
                    aria-hidden="true"
                    className="size-5 shrink-0 text-primary"
                />
                <h2
                    id="public-boundary-title"
                    className="text-sm font-semibold [overflow-wrap:anywhere] text-primary"
                >
                    Dibagikan oleh pemilik
                </h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
                Halaman ini menampilkan karya yang dipilih Publik dan memiliki
                sumber kontribusi yang disetujui kampus.
            </p>
            <dl className="grid gap-3 border-t border-border pt-3 text-xs">
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">Institusi</dt>
                    <dd className="font-semibold [overflow-wrap:anywhere]">
                        {profile.institution_name}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">
                        Batas data
                    </dt>
                    <dd className="font-semibold">
                        Tanpa bukti privat dan catatan kampus
                    </dd>
                </div>
            </dl>
        </aside>
    );
}

function VerificationMark({ entry }: { entry: PublicPortfolioEntry }) {
    return (
        <div
            className="max-w-full min-w-0"
            data-test={'public-entry-verification-' + entry.id}
        >
            <PortfolioVerificationBadge entry={entry} />
        </div>
    );
}

function ProvenanceFacts({ entry }: { entry: PublicPortfolioEntry }) {
    return (
        <dl className="grid min-w-0 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-3">
            <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">Sumber karya</dt>
                <dd className="font-semibold">Kontribusi disetujui</dd>
            </div>
            <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">
                    Tingkat verifikasi
                </dt>
                <dd className="font-semibold [overflow-wrap:anywhere]">
                    {entry.verification_label}
                </dd>
            </div>
            <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">Diterbitkan</dt>
                <dd>
                    <time dateTime={entry.published_at ?? undefined}>
                        {formatDate(entry.published_at)}
                    </time>
                </dd>
            </div>
        </dl>
    );
}

function FeaturedEntry({ entry }: { entry: PublicPortfolioEntry }) {
    return (
        <article
            className="grid min-w-0 gap-6 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-8"
            data-test="public-featured-entry"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold [overflow-wrap:anywhere] text-primary">
                    Karya terbaru
                </p>
                <VerificationMark entry={entry} />
            </div>
            <div className="grid min-w-0 gap-3">
                <h3 className="max-w-[42ch] text-2xl leading-snug font-bold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
                    {entry.title}
                </h3>
                <p className="max-w-[72ch] text-base leading-8 [overflow-wrap:anywhere] whitespace-pre-wrap">
                    {entry.summary}
                </p>
            </div>
            <p className="flex items-start gap-2 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                <History
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-primary"
                />
                {verificationDescriptions[entry.verification_level]}
            </p>
            <ProvenanceFacts entry={entry} />
        </article>
    );
}

function LedgerEntry({
    entry,
    index,
}: {
    entry: PublicPortfolioEntry;
    index: number;
}) {
    return (
        <li
            className="grid min-w-0 content-start gap-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"
            data-test={'public-entry-' + entry.id}
        >
            <span className="font-label text-label text-muted-foreground">
                {String(index).padStart(2, '0')}
            </span>
            <div className="grid min-w-0 gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold [overflow-wrap:anywhere] text-primary">
                        Karya publik
                    </span>
                    <VerificationMark entry={entry} />
                </div>
                <h3 className="text-xl leading-snug font-bold tracking-tight [overflow-wrap:anywhere] sm:text-2xl">
                    {entry.title}
                </h3>
                <p className="text-sm leading-7 [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">
                    {entry.summary}
                </p>
            </div>
            <div className="grid min-w-0 gap-2 border-t border-border pt-4 text-xs">
                <span className="text-muted-foreground">Sumber karya</span>
                <span className="font-semibold">Kontribusi disetujui</span>
                <time
                    dateTime={entry.published_at ?? undefined}
                    className="text-muted-foreground"
                >
                    {formatDate(entry.published_at)}
                </time>
            </div>
        </li>
    );
}

function PublishedPortfolio({
    profile,
    entries,
}: {
    profile: PublicPortfolioProfile;
    entries: PublicPortfolioEntry[];
}) {
    const [featuredEntry, ...remainingEntries] = entries;

    return (
        <main className="mx-auto grid w-full max-w-7xl min-w-0 gap-6 px-4 py-6 md:px-6 lg:px-8 lg:py-10">
            <section className="relative grid min-w-0 gap-6 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent via-sky-100 to-blue-100 p-5 shadow-md sm:p-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
                <ArchiveArt className="absolute -top-4 right-4 hidden w-44 rotate-12 opacity-25 sm:block lg:right-96" />
                <div className="relative grid min-w-0 gap-5">
                    <p className="text-sm font-semibold [overflow-wrap:anywhere] text-primary">
                        Portofolio publik
                    </p>
                    <div className="grid min-w-0 gap-3">
                        <h1 className="max-w-[22ch] text-3xl leading-tight font-bold [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl">
                            {profile.display_name}
                        </h1>
                        <p className="text-lg leading-7 font-medium [overflow-wrap:anywhere] text-muted-foreground">
                            {profile.study_program ?? 'Portofolio publik SATU'}
                        </p>
                    </div>
                    {profile.bio && (
                        <p className="max-w-[68ch] text-base leading-7 [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">
                            {profile.bio}
                        </p>
                    )}
                </div>
                <div className="relative min-w-0">
                    <ProjectionBoundary profile={profile} />
                </div>
            </section>

            <section
                aria-labelledby="public-portfolio-title"
                className="grid min-w-0 gap-5"
                data-test="public-portfolio-ledger"
            >
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 px-1 pt-2">
                    <div className="grid gap-1">
                        <div className="flex items-center gap-2">
                            <Globe2
                                aria-hidden="true"
                                className="size-4 text-primary"
                            />
                            <h2
                                id="public-portfolio-title"
                                className="text-xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-2xl"
                            >
                                Portofolio publik
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {entries.length} karya yang dibagikan secara
                            eksplisit oleh pemilik.
                        </p>
                    </div>
                    <span className="font-label text-label text-muted-foreground">
                        KOLEKSI / {String(entries.length).padStart(2, '0')}
                    </span>
                </div>

                {featuredEntry && <FeaturedEntry entry={featuredEntry} />}

                {remainingEntries.length > 0 && (
                    <ol
                        className="grid min-w-0 gap-5 lg:grid-cols-2"
                        aria-label="Karya portofolio publik lainnya"
                    >
                        {remainingEntries.map((entry, index) => (
                            <LedgerEntry
                                key={entry.id}
                                entry={entry}
                                index={index + 2}
                            />
                        ))}
                    </ol>
                )}
            </section>
        </main>
    );
}

function UnavailablePortfolio() {
    return (
        <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-4xl min-w-0 items-center px-4 py-8 md:px-6 lg:px-8">
            <section
                role="status"
                aria-labelledby="public-portfolio-unavailable-title"
                className="grid w-full min-w-0 gap-6 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-10"
                data-test="public-portfolio-unavailable"
            >
                <p className="font-label text-label text-correction">
                    PORTOFOLIO PUBLIK / TIDAK TERSEDIA
                </p>
                <div className="flex items-start gap-4">
                    <CircleAlert
                        aria-hidden="true"
                        className="mt-1 size-6 shrink-0 text-correction"
                    />
                    <div className="grid min-w-0 gap-3">
                        <h1
                            id="public-portfolio-unavailable-title"
                            className="max-w-[30ch] text-2xl leading-snug font-bold [overflow-wrap:anywhere] sm:text-3xl"
                        >
                            Portofolio ini tidak tersedia untuk dibaca.
                        </h1>
                        <p className="max-w-[62ch] text-body leading-7 text-muted-foreground">
                            Pemilik dapat menarik visibilitas kapan saja. Data
                            privat dan entri yang belum dipilih publik tidak
                            ditampilkan pada tautan ini.
                        </p>
                    </div>
                </div>
                <Link
                    href={home()}
                    className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
                >
                    Kembali ke SATU
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </section>
        </main>
    );
}

export default function PublicPortfolio({
    state,
    profile,
    entries,
    canonical_url,
    robots,
}: PublicPortfolioPageProps) {
    const isPublished =
        state === 'published' && profile !== null && entries.length > 0;
    const title = isPublished
        ? profile.display_name + ' | Portofolio publik'
        : 'Portofolio tidak tersedia';
    const description = isPublished
        ? 'Portofolio publik ' +
          profile.display_name +
          ', dengan entri yang dibagikan secara eksplisit.'
        : 'Portofolio publik ini tidak sedang tersedia untuk dibaca.';

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            <Head title={title}>
                <meta
                    name="description"
                    content={description}
                    head-key="description"
                />
                <meta name="robots" content={robots} head-key="robots" />
                <link
                    rel="canonical"
                    href={canonical_url}
                    head-key="canonical"
                />
            </Head>
            <PublicHeader />
            {isPublished ? (
                <PublishedPortfolio profile={profile} entries={entries} />
            ) : (
                <UnavailablePortfolio />
            )}
            <PublicFooter />
        </div>
    );
}
