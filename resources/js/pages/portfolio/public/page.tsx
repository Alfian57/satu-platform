import { Head } from '@inertiajs/react';
import type { PublicPortfolioPageProps } from '@/types/portfolio';
import {
    PublicFooter,
    PublicHeader,
    PublishedPortfolio,
    UnavailablePortfolio,
} from './_components';

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
