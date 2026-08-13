import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    CircleAlert,
    History,
    LockKeyhole,
    ShieldCheck,
} from 'lucide-react';
import { home } from '@/routes';
import type {
    PortfolioVerificationLevel,
    PublicPortfolioEntry,
    PublicPortfolioPageProps,
    PublicPortfolioProfile,
} from '@/types/portfolio';

/**
 * THESIS: A public portfolio should feel like a verified folio, not a social
 * profile or recruiter result.
 * OWN-WORLD: Buku Besar Kolaborasi rules, graphite ink, institutional blue,
 * compact verification marks, and flat ledger surfaces.
 * STORY: A visitor meets the maker, sees the published work, and can trace
 * each claim to its explicit verification level without seeing private proof.
 * FIRST VIEWPORT: Identity and the portfolio boundary lead on the left, with
 * the public projection contract in a quiet right rail.
 * FORM: Public ledger, grounded candidate 7, permissioned disclosure states.
 */

const verificationDescriptions: Record<PortfolioVerificationLevel, string> = {
    self_reported: 'Klaim yang ditulis dan dinyatakan oleh pemilik portfolio.',
    team_confirmed: 'Kontribusi yang dikonfirmasi oleh rekan satu tim.',
    institution_verified:
        'Kontribusi yang disetujui melalui validasi reviewer kampus.',
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
        <header className="border-b border-border bg-background">
            <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
                <Link
                    href={home()}
                    className="inline-flex cursor-pointer items-baseline gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    data-test="public-portfolio-brand"
                >
                    <span className="font-bold tracking-tight text-primary">
                        SATU
                    </span>
                    <span className="hidden text-sm text-muted-foreground sm:inline">
                        Buku Besar Kolaborasi
                    </span>
                </Link>
                <p className="font-label text-label text-muted-foreground">
                    PORTFOLIO PUBLIK
                </p>
            </div>
        </header>
    );
}

function PublicFooter() {
    return (
        <footer className="border-t border-border">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-6 lg:px-8">
                <p>SATU. Proyeksi yang dibagikan secara eksplisit.</p>
                <Link
                    href={home()}
                    className="w-fit cursor-pointer font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
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
            className="grid gap-4 border-y border-border px-4 py-5 md:border-y-0 md:border-l md:px-6 md:py-2"
            data-test="public-projection-boundary"
        >
            <div className="flex items-center gap-2">
                <BadgeCheck
                    aria-hidden="true"
                    className="size-5 text-verified"
                />
                <h2
                    id="public-boundary-title"
                    className="font-label text-label text-primary"
                >
                    PROYEKSI YANG DIIZINKAN
                </h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
                Halaman ini hanya menampilkan entry yang dipilih publik dan
                masih memiliki sumber contribution yang disetujui.
            </p>
            <dl className="grid gap-3 border-t border-border pt-3 text-xs">
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        INSTITUSI
                    </dt>
                    <dd className="font-semibold">
                        {profile.institution_name}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        BATAS DATA
                    </dt>
                    <dd className="font-semibold">
                        Tanpa evidence private dan audit mentah
                    </dd>
                </div>
            </dl>
        </aside>
    );
}

function VerificationMark({
    entry,
    compact = false,
}: {
    entry: PublicPortfolioEntry;
    compact?: boolean;
}) {
    return (
        <span
            className="inline-flex w-fit items-center gap-1.5 border border-verified/40 bg-verified-subtle px-2 py-1 text-xs font-semibold text-verified-subtle-foreground"
            data-test={'public-entry-verification-' + entry.id}
        >
            <ShieldCheck
                aria-hidden="true"
                className="size-3.5 text-verified"
            />
            {compact
                ? entry.verification_label
                : 'Tingkat ' + entry.verification_label}
        </span>
    );
}

function ProvenanceFacts({ entry }: { entry: PublicPortfolioEntry }) {
    return (
        <dl className="grid gap-4 border-t border-border pt-4 text-sm sm:grid-cols-3">
            <div className="grid gap-1">
                <dt className="font-label text-label text-muted-foreground">
                    PROVENANCE
                </dt>
                <dd className="font-semibold">Contribution disetujui</dd>
            </div>
            <div className="grid gap-1">
                <dt className="font-label text-label text-muted-foreground">
                    TINGKAT VERIFIKASI
                </dt>
                <dd className="font-semibold">{entry.verification_label}</dd>
            </div>
            <div className="grid gap-1">
                <dt className="font-label text-label text-muted-foreground">
                    DITERBITKAN
                </dt>
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
            className="grid gap-5 border-y border-border bg-card/50 px-4 py-7 md:px-8 md:py-9"
            data-test="public-featured-entry"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-label text-label text-primary">
                    ENTRY UTAMA / 01
                </p>
                <VerificationMark entry={entry} />
            </div>
            <div className="grid gap-3">
                <h3 className="max-w-[30ch] text-title font-bold text-balance md:text-headline">
                    {entry.title}
                </h3>
                <p className="max-w-[72ch] text-body leading-7 break-words text-muted-foreground">
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
            className="grid gap-4 px-4 py-5 md:grid-cols-[3rem_minmax(0,1fr)_minmax(14rem,0.45fr)] md:items-start md:px-6"
            data-test={'public-entry-' + entry.id}
        >
            <span className="font-label text-label text-muted-foreground">
                {String(index).padStart(2, '0')}
            </span>
            <div className="grid min-w-0 gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-label text-label text-primary">
                        PUBLIC ENTRY
                    </span>
                    <VerificationMark entry={entry} compact />
                </div>
                <h3 className="text-base font-bold break-words">
                    {entry.title}
                </h3>
                <p className="text-sm leading-6 break-words text-muted-foreground">
                    {entry.summary}
                </p>
            </div>
            <div className="grid gap-2 border-t border-border pt-3 text-xs md:border-t-0 md:border-l md:pt-0 md:pl-4">
                <span className="font-label text-label text-muted-foreground">
                    PROVENANCE
                </span>
                <span className="font-semibold">Contribution disetujui</span>
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
        <main className="mx-auto grid max-w-7xl gap-10 px-4 py-8 md:gap-14 md:px-6 md:py-12 lg:px-8 lg:py-16">
            <section className="grid gap-8 border-b border-border pb-8 md:grid-cols-[minmax(0,1fr)_22rem] md:items-end md:gap-12 md:pb-12">
                <div className="grid min-w-0 gap-5">
                    <p className="font-label text-label text-primary">
                        PUBLIC PORTFOLIO / VERIFIED PROJECTION
                    </p>
                    <div className="grid gap-3">
                        <h1 className="max-w-[16ch] text-headline font-bold text-balance md:text-display">
                            {profile.display_name}
                        </h1>
                        <p className="text-title font-semibold text-muted-foreground">
                            {profile.study_program ?? 'Portfolio publik SATU'}
                        </p>
                    </div>
                    {profile.bio && (
                        <p className="max-w-[68ch] text-body leading-7 text-muted-foreground">
                            {profile.bio}
                        </p>
                    )}
                </div>
                <ProjectionBoundary profile={profile} />
            </section>

            <section
                aria-labelledby="public-portfolio-title"
                className="grid gap-5"
                data-test="public-portfolio-ledger"
            >
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                    <div className="grid gap-1">
                        <div className="flex items-center gap-2">
                            <LockKeyhole
                                aria-hidden="true"
                                className="size-4 text-primary"
                            />
                            <h2
                                id="public-portfolio-title"
                                className="text-title font-bold"
                            >
                                Portfolio publik
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {entries.length} entry dengan provenance yang dapat
                            dibaca siapa pun yang menerima tautan ini.
                        </p>
                    </div>
                    <span className="font-label text-label text-muted-foreground">
                        INDEX / {String(entries.length).padStart(2, '0')}
                    </span>
                </div>

                {featuredEntry && <FeaturedEntry entry={featuredEntry} />}

                {remainingEntries.length > 0 && (
                    <ol
                        className="divide-y divide-border border-y border-border"
                        aria-label="Entry portfolio publik lainnya"
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
        <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl items-center px-4 py-12 md:px-6 lg:px-8">
            <section
                role="status"
                aria-labelledby="public-portfolio-unavailable-title"
                className="grid w-full gap-6 border-y border-border py-10 md:py-14"
                data-test="public-portfolio-unavailable"
            >
                <p className="font-label text-label text-correction">
                    PUBLIC PORTFOLIO / UNAVAILABLE
                </p>
                <div className="flex items-start gap-4">
                    <CircleAlert
                        aria-hidden="true"
                        className="mt-1 size-6 shrink-0 text-correction"
                    />
                    <div className="grid gap-3">
                        <h1
                            id="public-portfolio-unavailable-title"
                            className="max-w-[22ch] text-headline font-bold text-balance"
                        >
                            Portfolio ini tidak tersedia untuk dibaca.
                        </h1>
                        <p className="max-w-[62ch] text-body leading-7 text-muted-foreground">
                            Pemilik dapat menarik visibility kapan saja. Data
                            privat dan entry yang belum dipilih publik tidak
                            ditampilkan pada tautan ini.
                        </p>
                    </div>
                </div>
                <Link
                    href={home()}
                    className="inline-flex w-fit cursor-pointer items-center gap-2 border border-border px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
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
        ? profile.display_name + ' | Portfolio publik'
        : 'Portfolio tidak tersedia';
    const description = isPublished
        ? 'Portfolio publik ' +
          profile.display_name +
          ', dengan entry yang dibagikan secara eksplisit.'
        : 'Portfolio publik ini tidak sedang tersedia untuk dibaca.';

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
