import { Deferred, Head } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { AppPage } from '@/components/app-page';
import { PortfolioCollection } from '@/components/portfolio/portfolio-collection';
import { PortfolioEmpty } from '@/components/portfolio/portfolio-empty';
import { PortfolioEntriesError } from '@/components/portfolio/portfolio-entries-error';
import { PortfolioEntriesSkeleton } from '@/components/portfolio/portfolio-entries-skeleton';
import { PortfolioIndexAside } from '@/components/portfolio/portfolio-index-aside';
import { PortfolioIndexHeader } from '@/components/portfolio/portfolio-index-header';
import { usePortfolioCollection } from '@/hooks/use-portfolio-collection';
import { index as portfolioIndex } from '@/routes/portfolio';
import type { PortfolioIndexPageProps } from '@/types/portfolio';

export default function PortfolioIndex({
    profile,
    permissions,
    entries,
}: PortfolioIndexPageProps) {
    const { state, actions } = usePortfolioCollection({ entries, profile });
    const {
        isRefreshing,
        refreshError,
        isForbidden,
        resolvedProfile,
        resolvedEntries,
    } = state;

    return (
        <>
            <Head title="Portofolio" />
            <AppPage>
                <div
                    className="portfolio-discovery grid w-full min-w-0 gap-6"
                    data-test="portfolio-root"
                >
                    <PortfolioIndexHeader
                        isForbidden={isForbidden}
                        resolvedProfile={resolvedProfile}
                        profile={profile}
                        canManage={permissions.can_manage}
                        isRefreshing={isRefreshing}
                        onRefresh={actions.refresh}
                    />

                    {refreshError && (
                        <div
                            role="alert"
                            data-test="portfolio-refresh-error"
                            className="flex items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground"
                        >
                            <RefreshCw
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0"
                            />
                            <p>{refreshError}</p>
                        </div>
                    )}

                    {!isForbidden && (
                        <div
                            className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                            data-test="portfolio-grid"
                        >
                            <div className="grid min-w-0 content-start gap-5">
                                {resolvedProfile === null ? (
                                    <PortfolioEmpty profile={null} />
                                ) : (
                                    <Deferred
                                        data="entries"
                                        fallback={<PortfolioEntriesSkeleton />}
                                        rescue={({ reloading }) => (
                                            <PortfolioEntriesError
                                                onRetry={actions.refresh}
                                                retrying={
                                                    reloading || isRefreshing
                                                }
                                            />
                                        )}
                                    >
                                        {({ reloading }) => (
                                            <PortfolioCollection
                                                entries={resolvedEntries}
                                                profile={resolvedProfile}
                                                canManage={
                                                    permissions.can_manage
                                                }
                                                isRefreshing={
                                                    reloading || isRefreshing
                                                }
                                                onEntryUpdated={
                                                    actions.handleEntryUpdated
                                                }
                                                onAccessRevoked={
                                                    actions.handleAccessRevoked
                                                }
                                            />
                                        )}
                                    </Deferred>
                                )}
                            </div>

                            <PortfolioIndexAside
                                resolvedProfile={resolvedProfile}
                                canManage={permissions.can_manage}
                                onProfileUpdated={actions.handleProfileUpdated}
                                onAccessRevoked={actions.handleAccessRevoked}
                            />
                        </div>
                    )}
                </div>
            </AppPage>
        </>
    );
}

PortfolioIndex.layout = {
    breadcrumbs: [{ title: 'Portofolio', href: portfolioIndex() }],
};
