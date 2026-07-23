import {
    ArrowRight,
    Check,
    Clock3,
    Lightbulb,
    RefreshCw,
    SearchX,
    UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type {
    DashboardRecommendationRegion,
    DashboardReviewQueue,
} from '@/types';

type Props = {
    reviewQueue: DashboardReviewQueue;
    recommendationRegion: DashboardRecommendationRegion;
    onDemoAction: (actionLabel: string) => void;
};

function RecommendationState({
    region,
    onDemoAction,
}: {
    region: Extract<
        DashboardRecommendationRegion,
        { state: 'empty' | 'error' }
    >;
    onDemoAction: (actionLabel: string) => void;
}) {
    const Icon = region.state === 'error' ? RefreshCw : SearchX;
    const actionLabel = region.actionLabel;

    return (
        <div
            className="mt-4 border-y border-border bg-card px-4 py-5"
            data-test={`dashboard-recommendation-${region.state}`}
            role={region.state === 'error' ? 'alert' : undefined}
        >
            <Icon
                aria-hidden="true"
                className={cn(
                    'size-5',
                    region.state === 'error'
                        ? 'text-correction'
                        : 'text-primary',
                )}
            />
            <p className="mt-3 font-semibold">{region.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {region.description}
            </p>
            {actionLabel && (
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="mt-4 w-full border-primary text-primary hover:text-primary"
                    onClick={() => onDemoAction(actionLabel)}
                >
                    {actionLabel}
                    <ArrowRight aria-hidden="true" />
                </Button>
            )}
        </div>
    );
}

function RecommendationLoading({ announcement }: { announcement: string }) {
    return (
        <div
            aria-busy="true"
            aria-live="polite"
            className="mt-4 border border-border bg-card p-4"
            data-test="dashboard-recommendation-loading"
            role="status"
        >
            <span className="sr-only">{announcement}</span>
            <div aria-hidden="true" className="grid gap-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-full" />
                    <div className="grid w-full gap-2">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-11 w-full" />
            </div>
        </div>
    );
}

function RecommendationReady({
    region,
    onDemoAction,
}: {
    region: Extract<DashboardRecommendationRegion, { state: 'ready' }>;
    onDemoAction: (actionLabel: string) => void;
}) {
    const { recommendation } = region;

    return (
        <div className="mt-4 border border-border bg-card">
            <div className="flex items-start gap-3 border-b border-border px-4 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                    <UsersRound aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className="leading-5 font-bold wrap-anywhere">
                        {recommendation.title}
                    </p>
                    <p className="mt-1 text-sm wrap-anywhere text-muted-foreground">
                        Peran: {recommendation.role}
                    </p>
                </div>
            </div>

            <ul className="grid gap-3 px-4 py-4">
                {recommendation.reasons.map((reason) => (
                    <li
                        key={reason}
                        className="flex min-w-0 items-start gap-2 text-sm leading-5"
                        data-test="dashboard-recommendation-reason"
                    >
                        <span
                            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-primary"
                            data-test="dashboard-recommendation-marker"
                        >
                            <Check aria-hidden="true" className="size-3.5" />
                        </span>
                        <span className="min-w-0 wrap-anywhere">{reason}</span>
                    </li>
                ))}
            </ul>

            <div className="border-t border-border p-4">
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full border-primary text-primary hover:text-primary"
                    onClick={() => onDemoAction(recommendation.actionLabel)}
                >
                    {recommendation.actionLabel}
                    <ArrowRight aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}

export function DashboardContextRail({
    reviewQueue,
    recommendationRegion,
    onDemoAction,
}: Props) {
    return (
        <div
            className="grid gap-8 lg:grid-cols-2 xl:grid-cols-1"
            data-test="dashboard-context-rail"
        >
            <div className="lg:col-span-2 xl:col-span-1">
                <p className="font-label text-label font-semibold text-muted-foreground">
                    Ringkasan kerja
                </p>
                <h2 className="mt-2 text-title font-bold">Minggu ini</h2>
            </div>

            <section aria-labelledby="review-queue-heading">
                <h3 id="review-queue-heading" className="text-sm font-semibold">
                    Menunggu tinjauan
                </h3>
                <div className="mt-3 flex items-center gap-3 border-y border-pending/30 bg-pending-subtle px-4 py-4 text-pending-subtle-foreground">
                    <Clock3
                        aria-hidden="true"
                        className="size-7 shrink-0 stroke-[1.6]"
                    />
                    <p className="min-w-0 text-sm leading-5">
                        <span className="block font-bold">
                            {reviewQueue.count} {reviewQueue.itemLabel}
                        </span>
                        <span className="wrap-anywhere">
                            {reviewQueue.statusLabel}
                        </span>
                    </p>
                </div>
            </section>

            <section
                aria-labelledby="recommendation-heading"
                className="border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 xl:border-t xl:border-l-0 xl:pt-8 xl:pl-0"
            >
                <div className="flex items-center gap-2">
                    <Lightbulb
                        aria-hidden="true"
                        className="size-4 text-primary"
                    />
                    <h3
                        id="recommendation-heading"
                        className="text-sm font-semibold"
                    >
                        Rekomendasi untukmu
                    </h3>
                </div>

                {recommendationRegion.state === 'loading' && (
                    <RecommendationLoading
                        announcement={recommendationRegion.announcement}
                    />
                )}

                {(recommendationRegion.state === 'empty' ||
                    recommendationRegion.state === 'error') && (
                    <RecommendationState
                        region={recommendationRegion}
                        onDemoAction={onDemoAction}
                    />
                )}

                {recommendationRegion.state === 'ready' && (
                    <RecommendationReady
                        region={recommendationRegion}
                        onDemoAction={onDemoAction}
                    />
                )}
            </section>
        </div>
    );
}
