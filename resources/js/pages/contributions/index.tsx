import { Head } from '@inertiajs/react';
import { CircleAlert } from 'lucide-react';
import { AppPage } from '@/components/app-page';
import { ContributionCard } from '@/components/contributions/contribution-card';
import { EmptyContributions } from '@/components/contributions/contributions-empty';
import { ContributionsFilterBar } from '@/components/contributions/contributions-filter-bar';
import { ContributionsHero } from '@/components/contributions/contributions-hero';
import { ContributionsHowItWorks } from '@/components/contributions/contributions-how-it-works';
import { ContributionsNoMatches } from '@/components/contributions/contributions-no-matches';
import { ContributionsRefreshState } from '@/components/contributions/contributions-refresh-state';
import { useContributionCatalog } from '@/hooks/use-contribution-catalog';
import { index as contributionsIndex } from '@/routes/contributions';
import type { ContributionSummary } from '@/types/contribution';

export interface ContributionsIndexProps {
    contributions: ContributionSummary[];
    can_create: boolean;
}

export default function ContributionsIndex({
    contributions,
    can_create: canCreate,
}: ContributionsIndexProps) {
    const { state, actions } = useContributionCatalog({ contributions });

    return (
        <>
            <Head title="Kontribusi" />
            <AppPage className="min-w-0">
                <div
                    className="contribution-discovery grid w-full min-w-0 gap-6"
                    data-test="contributions-root"
                >
                    <ContributionsHero
                        canCreate={canCreate}
                        isForbidden={state.isForbidden}
                        isRefreshing={state.isRefreshing}
                        onRefresh={actions.refresh}
                    />

                    <ContributionsHowItWorks />

                    {state.refreshError && (
                        <div
                            role="alert"
                            data-test="contributions-refresh-error"
                            className="flex min-w-0 items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground"
                        >
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0"
                            />
                            <p className="wrap-anywhere">
                                {state.refreshError}
                            </p>
                        </div>
                    )}

                    {!state.isForbidden &&
                        (contributions.length === 0 ? (
                            <div
                                aria-busy={state.isRefreshing}
                                data-test="contributions-state"
                            >
                                {state.isRefreshing && (
                                    <ContributionsRefreshState />
                                )}
                                <EmptyContributions canCreate={canCreate} />
                            </div>
                        ) : (
                            <section
                                aria-labelledby="contributions-ledger-title"
                                aria-busy={state.isRefreshing}
                                data-test="contributions-ledger"
                                className="grid min-w-0 gap-5"
                            >
                                <ContributionsFilterBar
                                    query={state.query}
                                    status={state.status}
                                    totalCount={state.totalCount}
                                    visibleCount={
                                        state.visibleContributions.length
                                    }
                                    onQueryChange={actions.setQuery}
                                    onStatusChange={actions.setStatus}
                                />
                                {state.isRefreshing && (
                                    <ContributionsRefreshState />
                                )}
                                {state.visibleContributions.length > 0 ? (
                                    <ol className="grid min-w-0 gap-5 xl:grid-cols-2">
                                        {state.visibleContributions.map(
                                            (contribution) => (
                                                <ContributionCard
                                                    key={contribution.id}
                                                    contribution={contribution}
                                                />
                                            ),
                                        )}
                                    </ol>
                                ) : (
                                    <ContributionsNoMatches
                                        onReset={actions.resetFilters}
                                    />
                                )}
                            </section>
                        ))}
                </div>
            </AppPage>
        </>
    );
}

ContributionsIndex.layout = {
    breadcrumbs: [{ title: 'Kontribusi', href: contributionsIndex() }],
};
