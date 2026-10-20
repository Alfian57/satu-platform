import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    ArrowRight,
    AlertCircle,
    Building2,
    Check,
    ClipboardCheck,
    Clock3,
    Compass,
    EyeOff,
    Lightbulb,
    Info,
    RefreshCw,
    Rocket,
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
    pendingAffiliation?: boolean;
    referenceLayout?: boolean;
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
    onRefreshRecommendations?: () => void;
    refreshingRecommendations?: boolean;
    refreshError?: string | null;
    uncertainRefresh?: boolean;
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
            <Compass
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
            />
            <span className="min-w-0 wrap-anywhere">{action.label}</span>
            <ArrowRight
                aria-hidden="true"
                className="ml-auto size-4 shrink-0"
            />
        </>
    );
    const className =
        'mt-4 h-auto min-h-11 w-full cursor-pointer justify-start rounded-xl border-border bg-white py-3 text-sm font-semibold whitespace-normal text-primary hover:bg-accent';

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
    getActionHref: Props['getActionHref'];
    onAction: Props['onAction'];
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
                <Skeleton className="h-11 w-full rounded-xl" />
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
        hour: '2-digit',
        minute: '2-digit',
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
        key: 'profile',
        label: 'Perbarui profil',
    };
    const projectHref = getActionHref(projectAction);
    const profileHref = getActionHref(profileAction);
    const isProcessing = processingFeedback != null;
    const isStale = recommendation.isStale;

    return (
        <div className="dashboard-recommendation-card mt-5 overflow-hidden rounded-2xl border border-white bg-card shadow-sm">
            <div className="border-b border-border/60 p-4">
                <div className="min-w-0 flex-1">
                    <p className="text-lg leading-snug font-bold tracking-tight wrap-anywhere text-foreground">
                        {recommendation.title}
                    </p>
                    <p className="mt-3 inline-flex max-w-full items-start gap-2 rounded-xl bg-accent/70 px-3 py-2 text-xs leading-5 wrap-anywhere text-primary">
                        <UsersRound
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        <span className="min-w-0">
                            <span className="block font-medium text-muted-foreground">
                                Peran yang dibandingkan
                            </span>
                            <span className="font-semibold">
                                {recommendation.role}
                            </span>
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

            <p className="px-4 pt-4 text-xs font-semibold text-muted-foreground">
                Mengapa disarankan
            </p>
            <ul
                aria-label="Alasan kecocokan proyek"
                className="grid gap-3 px-4 pt-3 pb-4"
                data-test="dashboard-recommendation-reasons"
            >
                {recommendation.reasons.map((reason, index) => (
                    <li
                        key={`${index}-${reason}`}
                        className="flex min-w-0 items-start gap-2.5 text-sm leading-6 text-foreground"
                        data-test="dashboard-recommendation-reason"
                    >
                        <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                            {recommendation.reasonTypes?.[index] ===
                            'positive' ? (
                                <Check
                                    aria-hidden="true"
                                    className="size-3 stroke-[2.5]"
                                />
                            ) : recommendation.reasonTypes?.[index] ===
                              'attention' ? (
                                <AlertCircle
                                    aria-hidden="true"
                                    className="size-3"
                                />
                            ) : (
                                <Info aria-hidden="true" className="size-3" />
                            )}
                        </span>
                        <span className="min-w-0 wrap-anywhere">{reason}</span>
                    </li>
                ))}
            </ul>

            {recommendation.limitations?.length ? (
                <div
                    className="border-t border-border/60 px-4 py-3 text-xs leading-5 text-muted-foreground"
                    data-test="dashboard-recommendation-limitations"
                >
                    <p className="font-semibold text-foreground">
                        Batas pencocokan
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                        {recommendation.limitations.map((limitation) => (
                            <li key={limitation}>{limitation}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <dl className="grid gap-2 border-t border-border/60 px-4 py-3 text-xs">
                {recommendation.scoreVersion && (
                    <div className="flex min-w-0 items-baseline justify-between gap-2">
                        <dt className="text-muted-foreground">
                            Versi pencocokan
                        </dt>
                        <dd className="min-w-0 text-right font-label text-[0.6875rem] wrap-anywhere text-foreground">
                            {recommendation.scoreVersion}
                        </dd>
                    </div>
                )}
                <div className="flex min-w-0 items-baseline justify-between gap-2">
                    <dt className="text-muted-foreground">Dibuat</dt>
                    <dd className="min-w-0 text-right font-medium wrap-anywhere text-foreground">
                        <time dateTime={recommendation.createdAt}>
                            {formatRecommendationDate(recommendation.createdAt)}
                        </time>
                    </dd>
                </div>
                {recommendation.expiresAt && (
                    <div className="flex min-w-0 items-baseline justify-between gap-2">
                        <dt className="text-muted-foreground">
                            Berlaku sampai
                        </dt>
                        <dd className="min-w-0 text-right font-medium wrap-anywhere">
                            <time dateTime={recommendation.expiresAt}>
                                {formatRecommendationDate(
                                    recommendation.expiresAt,
                                )}
                            </time>
                        </dd>
                    </div>
                )}
            </dl>

            <div className="border-t border-border/50 bg-white/65 p-4">
                {projectHref !== null && (
                    <Button
                        asChild
                        variant="outline"
                        className="group min-h-11 w-full cursor-pointer rounded-xl border-primary/25 font-semibold text-primary hover:border-primary hover:bg-accent hover:text-primary motion-safe:transition-[background-color,border-color] motion-safe:duration-standard"
                    >
                        <Link href={projectHref}>
                            {projectAction.label}
                            <ArrowRight
                                aria-hidden="true"
                                className="ml-1.5 size-4 motion-safe:transition-transform motion-safe:duration-standard motion-safe:group-hover:translate-x-1"
                            />
                        </Link>
                    </Button>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs">
                    <button
                        type="button"
                        className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-lg px-2 font-medium text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors motion-safe:duration-standard"
                        disabled={isProcessing || isStale}
                        data-test="dashboard-recommendation-hide"
                        onClick={() => onFeedback(recommendation.id, 'hide')}
                    >
                        <EyeOff aria-hidden="true" className="size-3.5" />
                        Sembunyikan
                    </button>
                    <button
                        type="button"
                        className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-lg px-2 font-medium text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors motion-safe:duration-standard"
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
                            className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-lg px-2 font-semibold text-primary hover:bg-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            <UserRoundCog
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            {profileAction.label}
                        </Link>
                    )}
                </div>
                <p
                    className="mt-1 min-h-5 text-xs leading-5 font-medium text-primary"
                    role="status"
                >
                    {isProcessing ? 'Mengirim masukan...' : null}
                </p>
            </div>
        </div>
    );
}

function ProfileReadinessCard({
    profileReadiness,
    institution,
    referenceLayout = false,
}: {
    profileReadiness: DashboardProfileReadiness;
    institution: DashboardInstitution | null;
    referenceLayout?: boolean;
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
            className="min-w-0 border-t border-border px-1 pt-5"
        >
            <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center text-primary">
                    {referenceLayout ? (
                        <Rocket aria-hidden="true" className="size-4" />
                    ) : (
                        <Sparkles aria-hidden="true" className="size-4" />
                    )}
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
                            <span className="text-sm font-semibold text-foreground">
                                {profileReadiness.skillsCount}
                            </span>
                        </li>
                        <li className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                                Waktu kolaborasi
                            </span>
                            <span className="text-sm font-semibold text-foreground">
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
    pendingAffiliation = false,
    referenceLayout = false,
    recommendationRegion,
    getActionHref,
    onAction,
    onFeedback,
    processingFeedback,
    profileReadiness,
    institution,
    onRefreshRecommendations,
    refreshingRecommendations = false,
    refreshError,
    uncertainRefresh = false,
}: Props) {
    return (
        <div
            className="grid min-w-0 content-start gap-6 lg:grid-cols-2 xl:grid-cols-1"
            data-test="dashboard-context-rail"
        >
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
                            disabled={
                                refreshingRecommendations || uncertainRefresh
                            }
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
                    <RecommendationReady
                        region={recommendationRegion}
                        getActionHref={getActionHref}
                        onAction={onAction}
                        onFeedback={onFeedback}
                        processingFeedback={processingFeedback}
                    />
                )}
            </section>

            <div
                className={
                    referenceLayout
                        ? 'dashboard-support-card lg:col-span-2 xl:col-span-1'
                        : 'contents'
                }
            >
                <ProfileReadinessCard
                    profileReadiness={profileReadiness}
                    institution={institution}
                    referenceLayout={referenceLayout}
                />

                <section
                    aria-labelledby="review-queue-heading"
                    className="min-w-0 border-t border-border px-1 pt-5"
                >
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center text-primary">
                            <ClipboardCheck
                                aria-hidden="true"
                                className="size-4"
                            />
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
                            <p className="mt-1 text-sm leading-6 wrap-anywhere text-muted-foreground">
                                {reviewQueue.description}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
