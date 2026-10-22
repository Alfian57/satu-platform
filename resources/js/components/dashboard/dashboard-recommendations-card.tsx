import type { InertiaLinkProps } from '@inertiajs/react';
import {
    Clock3,
    Compass,
    Lightbulb,
    RefreshCw,
    SearchX,
    ShieldAlert,
} from 'lucide-react';
import { DashboardRecommendationReadyCard } from '@/components/dashboard/dashboard-recommendation-ready-card';
import { DashboardRegionAction } from '@/components/dashboard/dashboard-region-action';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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

function RecommendationLoading({ announcement }: { announcement: string }) {
    return (
        <div
            aria-busy="true"
            aria-live="polite"
            className="mt-4 border-t border-border/50 pt-4"
            data-test="dashboard-recommendation-loading"
            role="status"
        >
            <span className="sr-only">{announcement}</span>
            <div aria-hidden="true" className="grid gap-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-2xl" />
                    <div className="grid w-full gap-1.5">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-11 w-full rounded-xl" />
            </div>
        </div>
    );
}

function RecommendationState({
    region,
    getActionHref,
    onAction,
    pendingAffiliation = false,
}: {
    region: Extract<
        DashboardRecommendationRegion,
        {
            state:
                | 'empty'
                | 'error'
                | 'forbidden'
                | 'processing'
                | 'stale'
                | 'unavailable';
        }
    >;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
    pendingAffiliation?: boolean;
}) {
    const Icon =
        region.state === 'error'
            ? RefreshCw
            : region.state === 'forbidden'
              ? pendingAffiliation
                  ? Compass
                  : ShieldAlert
              : region.state === 'processing'
                ? Clock3
                : SearchX;

    return (
        <div
            className="dashboard-recommendation-state mt-4 border-t border-border/50 pt-4"
            data-test={`dashboard-recommendation-${region.state}`}
            role={region.state === 'error' ? 'alert' : 'status'}
        >
            <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                    <Icon
                        aria-hidden="true"
                        className={cn(
                            'size-5',
                            region.state === 'error' && 'text-correction',
                        )}
                    />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-bold text-foreground">
                        {region.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 wrap-anywhere text-muted-foreground">
                        {region.description}
                    </p>
                </div>
            </div>

            {region.action && (
                <DashboardRegionAction
                    action={region.action}
                    getActionHref={getActionHref}
                    onAction={onAction}
                />
            )}
        </div>
    );
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
                <RecommendationLoading
                    announcement={recommendationRegion.announcement}
                />
            )}

            {(recommendationRegion.state === 'empty' ||
                recommendationRegion.state === 'error' ||
                recommendationRegion.state === 'processing' ||
                recommendationRegion.state === 'stale' ||
                recommendationRegion.state === 'unavailable' ||
                recommendationRegion.state === 'forbidden') && (
                <RecommendationState
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
