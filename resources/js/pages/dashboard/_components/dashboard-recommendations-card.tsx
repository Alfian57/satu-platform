import type { InertiaLinkProps } from '@inertiajs/react';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardRecommendationLoading } from '@/pages/dashboard/_components/dashboard-recommendation-loading';
import { DashboardRecommendationReadyCard } from '@/pages/dashboard/_components/dashboard-recommendation-ready-card';
import { DashboardRecommendationState } from '@/pages/dashboard/_components/dashboard-recommendation-state';
import type { DashboardAction, DashboardRecommendationRegion } from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

export type DashboardRecommendationFeedback =
    'hide' | 'notRelevant' | 'profileFix';

interface DashboardRecommendationsCardProps {
    recommendationRegion: DashboardRecommendationRegion;
    pendingAffiliation?: boolean;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
    onFeedback: (
        recommendationId: number,
        feedback: DashboardRecommendationFeedback,
    ) => void;
    processingFeedback?: DashboardRecommendationFeedback | null;
    onRefreshRecommendations?: () => void;
    refreshingRecommendations?: boolean;
    refreshError?: string | null;
    uncertainRefresh?: boolean;
}

export function DashboardRecommendationsCard({
    recommendationRegion,
    pendingAffiliation = false,
    getActionHref,
    onAction,
    onFeedback,
    processingFeedback,
    onRefreshRecommendations,
    refreshingRecommendations = false,
    refreshError,
    uncertainRefresh = false,
}: DashboardRecommendationsCardProps) {
    return (
        <section
            aria-labelledby="recommendation-heading"
            className="min-w-0 rounded-3xl border border-border bg-linear-to-br from-accent/80 via-background to-accent/40 p-5 sm:p-6 lg:col-span-2 xl:col-span-1"
        >
            <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
                    <Lightbulb aria-hidden="true" className="size-4" />
                </span>
                <h2
                    id="recommendation-heading"
                    tabIndex={-1}
                    className="text-base font-bold text-foreground"
                >
                    Rekomendasi proyek
                </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Peluang yang bisa kamu pertimbangkan.
            </p>

            {recommendationRegion.state === 'loading' && (
                <DashboardRecommendationLoading
                    announcement={recommendationRegion.announcement}
                />
            )}

            {(recommendationRegion.state === 'empty' ||
                recommendationRegion.state === 'error' ||
                recommendationRegion.state === 'processing' ||
                recommendationRegion.state === 'stale' ||
                recommendationRegion.state === 'unavailable' ||
                recommendationRegion.state === 'forbidden') && (
                <DashboardRecommendationState
                    region={recommendationRegion}
                    pendingAffiliation={pendingAffiliation}
                    getActionHref={getActionHref}
                    onAction={onAction}
                />
            )}
            {recommendationRegion.state !== 'loading' &&
                recommendationRegion.canRefresh &&
                onRefreshRecommendations && (
                    <Button
                        type="button"
                        variant="outline"
                        className="mt-4 min-h-11 w-full whitespace-normal"
                        disabled={refreshingRecommendations || uncertainRefresh}
                        onClick={onRefreshRecommendations}
                        data-test="dashboard-request-recommendations"
                    >
                        <RefreshCw aria-hidden="true" className="size-4" />
                        {refreshingRecommendations
                            ? 'Meminta pembaruan...'
                            : 'Perbarui rekomendasi'}
                    </Button>
                )}
            {refreshError && (
                <div
                    className="mt-3 text-sm leading-6 text-correction"
                    role="alert"
                    data-test="dashboard-refresh-error"
                >
                    <p>{refreshError}</p>
                    <Button
                        type="button"
                        variant="outline"
                        className="mt-2 min-h-11"
                        onClick={() =>
                            onAction({
                                key: 'refresh',
                                label: 'Periksa status',
                            })
                        }
                    >
                        Periksa status
                    </Button>
                </div>
            )}

            {recommendationRegion.state === 'ready' && (
                <DashboardRecommendationReadyCard
                    region={recommendationRegion}
                    getActionHref={getActionHref}
                    onAction={onAction}
                    onFeedback={onFeedback}
                    processingFeedback={processingFeedback}
                />
            )}
        </section>
    );
}
