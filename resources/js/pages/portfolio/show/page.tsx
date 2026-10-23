import { Head } from '@inertiajs/react';
import { BookOpenCheck, CircleAlert } from 'lucide-react';
import { AppPage } from '@/layouts/_components/app-page';
import { portfolioStatusMeta } from '@/pages/portfolio/_utils/portfolio-presentation';
import { PortfolioEntryVisibilityControl } from '@/pages/portfolio/show/_components/portfolio-entry-visibility-control';
import { PortfolioProvenance } from '@/pages/portfolio/show/_components/portfolio-provenance';
import { PortfolioShowAside } from '@/pages/portfolio/show/_components/portfolio-show-aside';
import { PortfolioShowHeader } from '@/pages/portfolio/show/_components/portfolio-show-header';
import { PortfolioStatusBadge } from '@/pages/portfolio/show/_components/portfolio-status-badge';
import { PortfolioSummaryCard } from '@/pages/portfolio/show/_components/portfolio-summary-card';
import { usePortfolioDetail } from '@/pages/portfolio/show/_hooks/use-portfolio-detail';
import { index as portfolioIndex } from '@/routes/portfolio';
import type { PortfolioShowPageProps } from '@/types/portfolio';

export default function PortfolioShow({
    entry: initialEntry,
    profile,
    permissions,
}: PortfolioShowPageProps) {
    const { state, actions } = usePortfolioDetail({ initialEntry, profile });
    const { entry, resolvedProfile, isRefreshing, refreshError, isForbidden } =
        state;

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
                    <PortfolioShowHeader
                        entry={entry}
                        isForbidden={isForbidden}
                        isRefreshing={isRefreshing}
                        onRefresh={actions.refresh}
                    />

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
                                        onUpdated={actions.setEntryOverride}
                                        onAccessRevoked={
                                            actions.handleAccessRevoked
                                        }
                                        dataTestPrefix={`portfolio-detail-entry-${entry.id}`}
                                    />
                                )}

                                <PortfolioSummaryCard summary={entry.summary} />

                                <PortfolioProvenance entry={entry} />
                            </div>

                            <PortfolioShowAside
                                resolvedProfile={resolvedProfile}
                                canManageProfile={
                                    permissions.can_manage_profile
                                }
                                onProfileUpdated={actions.setProfileOverride}
                                onAccessRevoked={actions.handleAccessRevoked}
                            />
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
