import { Globe2 } from 'lucide-react';
import { DashboardArchiveArt as ArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';
import { FeaturedEntry } from '@/pages/portfolio/public/_components/featured-entry';
import { LedgerEntry } from '@/pages/portfolio/public/_components/ledger-entry';
import { ProjectionBoundary } from '@/pages/portfolio/public/_components/projection-boundary';
import type {
    PublicPortfolioEntry,
    PublicPortfolioProfile,
} from '@/types/portfolio';

export function PublishedPortfolio({
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
