import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    Clock3,
    EyeOff,
    Lightbulb,
    RefreshCw,
    SearchX,
    ShieldAlert,
    UserRoundCog,
    UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type {
    DashboardAction,
    DashboardRecommendationRegion,
    DashboardReviewQueue,
} from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

export type DashboardRecommendationFeedback =
    'hide' | 'notRelevant' | 'profileFix';

type Props = {
    reviewQueue: DashboardReviewQueue;
    recommendationRegion: DashboardRecommendationRegion;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
    onFeedback: (
        recommendationId: number,
        feedback: DashboardRecommendationFeedback,
    ) => void;
    processingFeedback?: DashboardRecommendationFeedback | null;
};

function RegionAction({
    action,
    getActionHref,
    onAction,
}: {
    action: DashboardAction;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
}) {
    const href = getActionHref(action);

    if (href !== null) {
        return (
            <Button
                asChild
                variant="outline"
                size="lg"
                className="mt-4 w-full border-primary text-primary hover:text-primary"
            >
                <Link href={href}>
                    {action.label}
                    <ArrowRight aria-hidden="true" />
                </Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-4 w-full border-primary text-primary hover:text-primary"
            onClick={() => onAction(action)}
        >
            {action.label}
            <ArrowRight aria-hidden="true" />
        </Button>
    );
}

function RecommendationState({
    region,
    getActionHref,
    onAction,
}: {
    region: Extract<
        DashboardRecommendationRegion,
        { state: 'empty' | 'error' | 'forbidden' }
    >;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
}) {
    const Icon =
        region.state === 'error'
            ? RefreshCw
            : region.state === 'forbidden'
              ? ShieldAlert
              : SearchX;

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
            {region.action && (
                <RegionAction
                    action={region.action}
                    getActionHref={getActionHref}
                    onAction={onAction}
                />
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
    getActionHref,
    onFeedback,
    processingFeedback,
}: {
    region: Extract<DashboardRecommendationRegion, { state: 'ready' }>;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onFeedback: (
        recommendationId: number,
        feedback: DashboardRecommendationFeedback,
    ) => void;
    processingFeedback?: DashboardRecommendationFeedback | null;
}) {
    const { recommendation } = region;
    const projectAction: DashboardAction = {
        key: 'project',
        label: 'Lihat detail project',
        projectId: recommendation.projectId ?? undefined,
    };
    const profileAction: DashboardAction = {
        key: 'onboarding',
        label: 'Perbarui profil',
    };
    const isProcessing =
        processingFeedback !== null && processingFeedback !== undefined;
    const isStale = recommendation.isStale;

    return (
        <div className="mt-4 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-all duration-standard hover:shadow-md motion-reduce:transition-none">
            <div className="flex items-center gap-3.5 border-b border-border/80 bg-muted/20 px-4 py-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-accent text-primary shadow-2xs">
                    <UsersRound aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className="leading-5 font-bold wrap-anywhere">
                        {recommendation.title}
                    </p>
                    <p className="mt-1 text-sm wrap-anywhere text-muted-foreground">
                        Peran:{' '}
                        <span className="font-semibold text-foreground">
                            {recommendation.role}
                        </span>
                    </p>
                </div>
            </div>

            {isStale && (
                <p
                    className="border-b border-pending/30 bg-pending-subtle px-4 py-3 text-sm leading-5 text-pending-subtle-foreground"
                    data-test="dashboard-recommendation-stale"
                    role="status"
                >
                    Versi pencocokan item ini sudah berubah. Muat ulang sebelum
                    memberi feedback.
                </p>
            )}

            <ul
                aria-label="Alasan kecocokan project"
                className="grid gap-2.5 px-4 py-3"
                data-test="dashboard-recommendation-reasons"
            >
                {recommendation.reasons.map((reason) => (
                    <li
                        key={reason}
                        className="flex min-w-0 items-start gap-2.5 text-sm leading-5"
                        data-test="dashboard-recommendation-reason"
                    >
                        <span
                            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-verified/30 bg-accent text-primary shadow-2xs"
                            data-test="dashboard-recommendation-marker"
                        >
                            <Check
                                aria-hidden="true"
                                className="size-3.5 stroke-[2.5]"
                            />
                        </span>
                        <span className="min-w-0 wrap-anywhere text-foreground/90">
                            {reason}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="border-t border-border/80 bg-muted/10 p-3">
                {recommendation.projectId !== null &&
                    getActionHref(projectAction) !== null && (
                        <Button
                            asChild
                            size="lg"
                            className="group w-full transition-all hover:bg-primary hover:text-white"
                        >
                            <Link href={getActionHref(projectAction)!}>
                                {projectAction.label}
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-4 transition-transform group-hover:translate-x-1"
                                />
                            </Link>
                        </Button>
                    )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-primary"
                        disabled={isProcessing || isStale}
                        data-test="dashboard-recommendation-hide"
                        onClick={() => onFeedback(recommendation.id, 'hide')}
                    >
                        <EyeOff aria-hidden="true" />
                        Sembunyikan
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        disabled={isProcessing || isStale}
                        data-test="dashboard-recommendation-not-relevant"
                        onClick={() =>
                            onFeedback(recommendation.id, 'notRelevant')
                        }
                    >
                        Tidak relevan
                    </Button>
                    {getActionHref(profileAction) !== null && (
                        <Button
                            asChild
                            type="button"
                            variant="link"
                            size="sm"
                            className="ml-auto text-primary"
                        >
                            <Link href={getActionHref(profileAction)!}>
                                <UserRoundCog aria-hidden="true" />
                                {profileAction.label}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function DashboardContextRail({
    reviewQueue,
    recommendationRegion,
    getActionHref,
    onAction,
    onFeedback,
    processingFeedback,
}: Props) {
    return (
        <div
            className="grid gap-8 lg:grid-cols-2 xl:grid-cols-1"
            data-test="dashboard-context-rail"
        >
            <div className="lg:col-span-2 xl:col-span-1">
                <p className="font-label text-label font-semibold tracking-wider text-muted-foreground uppercase">
                    Ringkasan kerja
                </p>
                <h2 className="mt-1 text-title font-bold">Minggu ini</h2>
            </div>

            <section aria-labelledby="review-queue-heading">
                <h3 id="review-queue-heading" className="text-sm font-semibold">
                    Menunggu tinjauan
                </h3>
                <div className="mt-3 flex items-start gap-3.5 rounded-xl border border-border bg-muted/30 px-4 py-4 text-muted-foreground shadow-sm">
                    <span className="flex shrink-0 rounded-lg bg-muted p-2 text-primary shadow-2xs">
                        <Clock3
                            aria-hidden="true"
                            className="size-6 stroke-[1.8]"
                        />
                    </span>
                    <p className="min-w-0 text-sm leading-5">
                        <span className="block text-base font-bold text-foreground">
                            {reviewQueue.title}
                        </span>
                        <span className="mt-1 block wrap-anywhere">
                            {reviewQueue.description}
                        </span>
                    </p>
                </div>
            </section>

            <section
                aria-labelledby="recommendation-heading"
                className="border-t border-border/80 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 xl:border-t xl:border-l-0 xl:pt-8 xl:pl-0"
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
                        Recommendation untukmu
                    </h3>
                </div>

                {recommendationRegion.state === 'loading' && (
                    <RecommendationLoading
                        announcement={recommendationRegion.announcement}
                    />
                )}

                {(recommendationRegion.state === 'empty' ||
                    recommendationRegion.state === 'error' ||
                    recommendationRegion.state === 'forbidden') && (
                    <RecommendationState
                        region={recommendationRegion}
                        getActionHref={getActionHref}
                        onAction={onAction}
                    />
                )}

                {recommendationRegion.state === 'ready' && (
                    <RecommendationReady
                        region={recommendationRegion}
                        getActionHref={getActionHref}
                        onFeedback={onFeedback}
                        processingFeedback={processingFeedback}
                    />
                )}
            </section>
        </div>
    );
}
