import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    portfolioStatusMeta,
    portfolioVisibilityOptions,
} from '@/pages/portfolio/_utils/portfolio-presentation';
import { PortfolioCard } from '@/pages/portfolio/index/_components/portfolio-card';
import { PortfolioEmpty } from '@/pages/portfolio/index/_components/portfolio-empty';
import { PortfolioEntriesSkeleton } from '@/pages/portfolio/index/_components/portfolio-entries-skeleton';
import type {
    PortfolioEntry,
    PortfolioEntryStatus,
    PortfolioProfile,
    PortfolioVisibility,
} from '@/types/portfolio';

export interface PortfolioCollectionProps {
    entries: PortfolioEntry[];
    profile: PortfolioProfile;
    canManage: boolean;
    isRefreshing: boolean;
    onEntryUpdated: (entry: PortfolioEntry) => void;
    onAccessRevoked: () => void;
}

export function PortfolioCollection({
    entries,
    profile,
    canManage,
    isRefreshing,
    onEntryUpdated,
    onAccessRevoked,
}: PortfolioCollectionProps) {
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
                            onAccessRevoked={onAccessRevoked}
                        />
                    ))}
                </ol>
            )}
        </section>
    );
}
