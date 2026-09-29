import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Check,
    ClipboardCheck,
    Clock3,
    Compass,
    EyeOff,
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
    DashboardInstitution,
    DashboardProfileReadiness,
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
    profileReadiness: DashboardProfileReadiness;
    institution: DashboardInstitution | null;
};

function RegionAction({
    action,
    getActionHref,
    onAction,
}: {
    action: DashboardAction;
    getActionHref: Props['getActionHref'];
    onAction: Props['onAction'];
}) {
    const href = getActionHref(action);
    const content = (
        <>
            <Compass aria-hidden="true" className="size-4 text-primary" />
            {action.label}
            <ArrowRight aria-hidden="true" className="ml-auto size-4" />
        </>
    );
    const className =
        'mt-4 min-h-11 w-full cursor-pointer justify-start rounded-full border-border bg-white text-sm font-semibold text-primary hover:bg-accent';

    if (href !== null) {
        return (
            <Button
                asChild
                variant="outline"
                className={className}
                data-test="dashboard-context-action"
            >
                <Link href={href}>{content}</Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            className={className}
            data-test="dashboard-context-action"
            onClick={() => onAction(action)}
        >
            {content}
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
    getActionHref: Props['getActionHref'];
    onAction: Props['onAction'];
}) {
    const Icon =
        region.state === 'error'
            ? RefreshCw
            : region.state === 'forbidden'
              ? ShieldAlert
              : SearchX;

    return (
        <div
            className="mt-4 border-t border-border/50 pt-4"
            data-test={`dashboard-recommendation-${region.state}`}
            role={region.state === 'error' ? 'alert' : undefined}
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
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {region.description}
                    </p>
                </div>
            </div>

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
                <Skeleton className="h-11 w-full rounded-full" />
            </div>
        </div>
    );
}

function formatRecommendationDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.valueOf())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
    }).format(date);
}

function RecommendationReady({
    region,
    getActionHref,
    onAction,
    onFeedback,
    processingFeedback,
}: {
    region: Extract<DashboardRecommendationRegion, { state: 'ready' }>;
    getActionHref: Props['getActionHref'];
    onAction: Props['onAction'];
    onFeedback: Props['onFeedback'];
    processingFeedback?: Props['processingFeedback'];
}) {
    const { recommendation } = region;
    const projectAction: DashboardAction = {
        key: 'project',
        label: 'Lihat proyek',
        projectId: recommendation.projectId ?? undefined,
    };
    const profileAction: DashboardAction = {
        key: 'onboarding',
        label: 'Perbarui profil',
    };
    const projectHref = getActionHref(projectAction);
    const profileHref = getActionHref(profileAction);
    const isProcessing = processingFeedback != null;
    const isStale = recommendation.isStale;

    return (
        <div className="mt-4 overflow-hidden rounded-2xl bg-background/70">
            <div className="flex items-start gap-3.5 border-b border-border/50 bg-white/70 p-4 sm:p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                    <UsersRound aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight font-bold wrap-anywhere text-foreground">
                        {recommendation.title}
                    </p>
                    <p className="mt-1 text-xs wrap-anywhere text-muted-foreground">
                        Peran:{' '}
                        <span className="font-semibold text-primary">
                            {recommendation.role}
                        </span>
                    </p>
                </div>
            </div>

            {isStale && (
                <p
                    className="border-b border-pending/30 bg-pending-subtle px-4 py-2.5 text-xs leading-5 text-pending-subtle-foreground"
                    data-test="dashboard-recommendation-stale"
                    role="status"
                >
                    Versi pencocokan proyek ini sudah berubah. Muat ulang
                    sebelum mengirim masukan.
                </p>
            )}
            {isStale && (
                <div className="px-4">
                    <RegionAction
                        action={{
                            key: 'refresh',
                            label: 'Muat ulang rekomendasi',
                        }}
                        getActionHref={getActionHref}
                        onAction={onAction}
                    />
                </div>
            )}

            <ul
                aria-label="Alasan kecocokan proyek"
                className="grid gap-2.5 p-4 sm:p-5"
                data-test="dashboard-recommendation-reasons"
            >
                {recommendation.reasons.map((reason, index) => (
                    <li
                        key={`${index}-${reason}`}
                        className="flex min-w-0 items-start gap-2 text-xs leading-5 text-foreground"
                        data-test="dashboard-recommendation-reason"
                    >
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-verified-subtle text-verified-subtle-foreground">
                            <Check
                                aria-hidden="true"
                                className="size-3 stroke-[2.5]"
                            />
                        </span>
                        <span className="min-w-0 wrap-anywhere">{reason}</span>
                    </li>
                ))}
            </ul>

            <dl className="grid gap-2 border-t border-border/50 px-4 py-3 text-xs sm:grid-cols-2 sm:px-5">
                {recommendation.scoreVersion && (
                    <div className="flex min-w-0 items-baseline justify-between gap-2">
                        <dt className="text-muted-foreground">
                            Versi pencocokan
                        </dt>
                        <dd className="min-w-0 truncate font-medium text-foreground">
                            {recommendation.scoreVersion}
                        </dd>
                    </div>
                )}
                <div className="flex min-w-0 items-baseline justify-between gap-2 sm:justify-end">
                    <dt className="text-muted-foreground">Dibuat</dt>
                    <dd className="font-medium text-foreground">
                        <time dateTime={recommendation.createdAt}>
                            {formatRecommendationDate(recommendation.createdAt)}
                        </time>
                    </dd>
                </div>
            </dl>

            <div className="border-t border-border/50 bg-white/65 p-4">
                {projectHref !== null && (
                    <Button
                        asChild
                        className="group min-h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    >
                        <Link href={projectHref}>
                            {projectAction.label}
                            <ArrowRight
                                aria-hidden="true"
                                className="ml-1.5 size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
                            />
                        </Link>
                    </Button>
                )}

                {isProcessing && (
                    <span className="sr-only" role="status">
                        Memproses masukan rekomendasi.
                    </span>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs">
                    <button
                        type="button"
                        className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-lg px-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isProcessing || isStale}
                        data-test="dashboard-recommendation-hide"
                        onClick={() => onFeedback(recommendation.id, 'hide')}
                    >
                        <EyeOff aria-hidden="true" className="size-3.5" />
                        Sembunyikan
                    </button>
                    <button
                        type="button"
                        className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-lg px-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isProcessing || isStale}
                        data-test="dashboard-recommendation-not-relevant"
                        onClick={() =>
                            onFeedback(recommendation.id, 'notRelevant')
                        }
                    >
                        Tidak relevan
                    </button>
                    {profileHref !== null && (
                        <Link
                            href={profileHref}
                            className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-lg px-2 font-semibold text-primary hover:bg-accent hover:underline"
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

function ProfileReadinessCard({
    profileReadiness,
    institution,
}: {
    profileReadiness: DashboardProfileReadiness;
    institution: DashboardInstitution | null;
}) {
    const readinessCopy: Record<DashboardProfileReadiness['state'], string> = {
        unavailable:
            'Ringkasan profil muncul setelah afiliasi kampus terverifikasi.',
        missing:
            'Profil belum dibuat. Lengkapi keahlian dan waktu kolaborasimu.',
        incomplete:
            'Lengkapi profil agar alasan kecocokan proyek dapat ditampilkan.',
        ready: 'Profilmu memiliki keahlian dan ketersediaan untuk pencocokan.',
    };
    const canShowCounts = profileReadiness.state !== 'unavailable';

    return (
        <section
            aria-labelledby="dashboard-readiness-heading"
            className="rounded-3xl border border-white bg-card p-5 shadow-sm"
        >
            <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                    <Sparkles aria-hidden="true" className="size-4" />
                </span>
                <h2
                    id="dashboard-readiness-heading"
                    className="text-base font-bold text-foreground"
                >
                    Bekal kolaborasimu
                </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {readinessCopy[profileReadiness.state]}
            </p>

            <ul className="mt-4 grid gap-3 text-sm">
                <li className="flex min-w-0 items-start gap-2.5">
                    <Building2
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span className="min-w-0 wrap-anywhere">
                        {institution?.name ??
                            'Afiliasi kampus belum terverifikasi'}
                    </span>
                </li>
                {canShowCounts && (
                    <>
                        <li className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                            <span className="text-muted-foreground">
                                Keahlian di profil
                            </span>
                            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
                                {profileReadiness.skillsCount}
                            </span>
                        </li>
                        <li className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                                Waktu kolaborasi
                            </span>
                            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
                                {profileReadiness.availabilityCount}
                            </span>
                        </li>
                    </>
                )}
            </ul>
        </section>
    );
}

export function DashboardContextRail({
    reviewQueue,
    recommendationRegion,
    getActionHref,
    onAction,
    onFeedback,
    processingFeedback,
    profileReadiness,
    institution,
}: Props) {
    return (
        <div
            className="grid content-start gap-5 lg:grid-cols-2 xl:grid-cols-1 xl:pt-10"
            data-test="dashboard-context-rail"
        >
            <ProfileReadinessCard
                profileReadiness={profileReadiness}
                institution={institution}
            />

            <section
                aria-labelledby="review-queue-heading"
                className="min-w-0 rounded-3xl border border-border/60 bg-white/60 p-5"
            >
                <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                        <ClipboardCheck aria-hidden="true" className="size-4" />
                    </span>
                    <h2
                        id="review-queue-heading"
                        className="text-sm font-semibold text-foreground"
                    >
                        Validasi kontribusi
                    </h2>
                </div>

                <div className="mt-3 flex items-start gap-3">
                    <Clock3
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <div className="min-w-0">
                        <p className="text-sm leading-snug font-semibold text-foreground">
                            {reviewQueue.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed wrap-anywhere text-muted-foreground">
                            {reviewQueue.description}
                        </p>
                    </div>
                </div>
            </section>

            <section
                aria-labelledby="recommendation-heading"
                className="min-w-0 rounded-3xl border border-white bg-card p-5 shadow-sm lg:col-span-2 xl:col-span-1"
            >
                <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                        <Lightbulb aria-hidden="true" className="size-4" />
                    </span>
                    <h2
                        id="recommendation-heading"
                        className="text-base font-bold text-foreground"
                    >
                        Rekomendasi proyek
                    </h2>
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
                        onAction={onAction}
                        onFeedback={onFeedback}
                        processingFeedback={processingFeedback}
                    />
                )}
            </section>
        </div>
    );
}
