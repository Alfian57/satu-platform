import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    ClipboardCheck,
    Clock3,
    Compass,
    EyeOff,
    FileCheck2,
    Lightbulb,
    RefreshCw,
    SearchX,
    ShieldAlert,
    Sparkles,
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
                className="mt-4 h-10 w-full cursor-pointer rounded-xl border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:text-sm"
            >
                <Link href={href}>
                    <Compass className="mr-1.5 size-4 text-blue-600" />
                    {action.label}
                    <ArrowRight
                        aria-hidden="true"
                        className="ml-1.5 size-3.5"
                    />
                </Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            className="mt-4 h-10 w-full cursor-pointer rounded-xl border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:text-sm"
            onClick={() => onAction(action)}
        >
            <Compass className="mr-1.5 size-4 text-blue-600" />
            {action.label}
            <ArrowRight aria-hidden="true" className="ml-1.5 size-3.5" />
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
            className="mt-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-slate-300/90"
            data-test={`dashboard-recommendation-${region.state}`}
            role={region.state === 'error' ? 'alert' : undefined}
        >
            <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                    <Icon
                        aria-hidden="true"
                        className={cn(
                            'size-5 stroke-[2]',
                            region.state === 'error'
                                ? 'text-rose-600'
                                : 'text-blue-600',
                        )}
                    />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-bold text-slate-900">
                        {region.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {region.description}
                    </p>
                </div>
            </div>

            {region.action && (
                <div className="pt-1">
                    <RegionAction
                        action={region.action}
                        getActionHref={getActionHref}
                        onAction={onAction}
                    />
                </div>
            )}
        </div>
    );
}

function RecommendationLoading({ announcement }: { announcement: string }) {
    return (
        <div
            aria-busy="true"
            aria-live="polite"
            className="mt-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs"
            data-test="dashboard-recommendation-loading"
            role="status"
        >
            <span className="sr-only">{announcement}</span>
            <div aria-hidden="true" className="grid gap-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-xl" />
                    <div className="grid w-full gap-1.5">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-10 w-full rounded-xl" />
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
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <div className="flex items-start gap-3.5 border-b border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                    <UsersRound
                        aria-hidden="true"
                        className="size-5 stroke-[2]"
                    />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight font-bold wrap-anywhere text-slate-900">
                        {recommendation.title}
                    </p>
                    <p className="mt-1 text-xs wrap-anywhere text-slate-500">
                        Peran:{' '}
                        <span className="font-bold text-blue-700">
                            {recommendation.role}
                        </span>
                    </p>
                </div>
            </div>

            {isStale && (
                <p
                    className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-800"
                    data-test="dashboard-recommendation-stale"
                    role="status"
                >
                    Versi pencocokan item ini sudah berubah. Muat ulang sebelum
                    memberi feedback.
                </p>
            )}

            <ul
                aria-label="Alasan kecocokan project"
                className="grid gap-2.5 p-4 sm:p-5"
                data-test="dashboard-recommendation-reasons"
            >
                {recommendation.reasons.map((reason) => (
                    <li
                        key={reason}
                        className="flex min-w-0 items-start gap-2 text-xs leading-5 text-slate-700"
                        data-test="dashboard-recommendation-reason"
                    >
                        <span
                            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded bg-emerald-50 text-emerald-700"
                            data-test="dashboard-recommendation-marker"
                        >
                            <Check
                                aria-hidden="true"
                                className="size-3 stroke-[2.5]"
                            />
                        </span>
                        <span className="min-w-0 wrap-anywhere">{reason}</span>
                    </li>
                ))}
            </ul>

            <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                {recommendation.projectId !== null &&
                    getActionHref(projectAction) !== null && (
                        <Button
                            asChild
                            size="sm"
                            className="group h-10 w-full rounded-xl bg-blue-600 font-bold text-white shadow-sm transition-all hover:bg-blue-700"
                        >
                            <Link href={getActionHref(projectAction)!}>
                                {projectAction.label}
                                <ArrowRight
                                    aria-hidden="true"
                                    className="ml-1.5 size-4 transition-transform group-hover:translate-x-1"
                                />
                            </Link>
                        </Button>
                    )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-1 text-xs">
                    <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1 text-[0.7rem] font-semibold text-slate-500 transition-colors hover:text-blue-600"
                        disabled={isProcessing || isStale}
                        data-test="dashboard-recommendation-hide"
                        onClick={() => onFeedback(recommendation.id, 'hide')}
                    >
                        <EyeOff aria-hidden="true" className="size-3.5" />
                        Sembunyikan
                    </button>
                    <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1 text-[0.7rem] font-semibold text-slate-400 transition-colors hover:text-slate-700"
                        disabled={isProcessing || isStale}
                        data-test="dashboard-recommendation-not-relevant"
                        onClick={() =>
                            onFeedback(recommendation.id, 'notRelevant')
                        }
                    >
                        Tidak relevan
                    </button>
                    {getActionHref(profileAction) !== null && (
                        <Link
                            href={getActionHref(profileAction)!}
                            className="ml-auto inline-flex items-center gap-1 text-[0.7rem] font-semibold text-blue-600 hover:underline"
                        >
                            <UserRoundCog
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            {profileAction.label}
                        </Link>
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
            className="grid gap-6 lg:grid-cols-2 xl:grid-cols-1"
            data-test="dashboard-context-rail"
        >
            {/* Context Rail Header */}
            <div className="border-b border-slate-200/80 pb-4 lg:col-span-2 xl:col-span-1">
                <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Sparkles className="size-3.5" />
                    </span>
                    <p className="font-label text-xs font-bold tracking-wider text-blue-700 uppercase">
                        Ringkasan Kerja
                    </p>
                </div>
                <h2 className="mt-1.5 text-lg font-extrabold tracking-tight text-slate-950">
                    Minggu ini
                </h2>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    Ringkasan memakai data akun dan konteks institusimu.
                </p>
            </div>

            {/* Review Queue Card */}
            <section aria-labelledby="review-queue-heading" className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <ClipboardCheck className="size-3.5" />
                    </span>
                    <h3
                        id="review-queue-heading"
                        className="font-label text-xs font-bold tracking-wider text-slate-500 uppercase"
                    >
                        Menunggu tinjauan
                    </h3>
                </div>

                <div className="mt-3 flex items-start gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-slate-300/90">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                        <Clock3
                            aria-hidden="true"
                            className="size-5 stroke-[2]"
                        />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug font-bold text-slate-900">
                            {reviewQueue.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed wrap-anywhere text-slate-500">
                            {reviewQueue.description}
                        </p>
                    </div>
                </div>
            </section>

            {/* Recommendation Card */}
            <section
                aria-labelledby="recommendation-heading"
                className="border-t border-slate-200/80 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 xl:border-t xl:border-l-0 xl:pt-6 xl:pl-0"
            >
                <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Lightbulb aria-hidden="true" className="size-3.5" />
                    </span>
                    <h3
                        id="recommendation-heading"
                        className="font-label text-xs font-bold tracking-wider text-slate-500 uppercase"
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
