import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Check,
    EyeOff,
    Info,
    UserRoundCog,
    UsersRound,
} from 'lucide-react';
import { DashboardRegionAction } from '@/components/dashboard/dashboard-region-action';
import { Button } from '@/components/ui/button';
import type { DashboardAction, DashboardRecommendationRegion } from '@/types';
import type { DashboardRecommendationFeedback } from './dashboard-recommendations-card';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

interface DashboardRecommendationReadyCardProps {
    region: Extract<DashboardRecommendationRegion, { state: 'ready' }>;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
    onFeedback: (
        recommendationId: number,
        feedback: DashboardRecommendationFeedback,
    ) => void;
    processingFeedback?: DashboardRecommendationFeedback | null;
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

export function DashboardRecommendationReadyCard({
    region,
    getActionHref,
    onAction,
    onFeedback,
    processingFeedback,
}: DashboardRecommendationReadyCardProps) {
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
                    <DashboardRegionAction
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
