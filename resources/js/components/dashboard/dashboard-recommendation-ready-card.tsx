import type { InertiaLinkProps } from '@inertiajs/react';
import { UsersRound } from 'lucide-react';
import { DashboardRecommendationFeedbackActions } from '@/components/dashboard/dashboard-recommendation-feedback-actions';
import { DashboardRecommendationReasons } from '@/components/dashboard/dashboard-recommendation-reasons';
import { DashboardRegionAction } from '@/components/dashboard/dashboard-region-action';
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

            <DashboardRecommendationReasons
                reasons={recommendation.reasons}
                reasonTypes={recommendation.reasonTypes}
                limitations={recommendation.limitations}
            />

            <dl className="grid gap-2 border-t border-border/60 px-4 py-3 text-xs">
                {recommendation.scoreVersion && (
                    <div className="flex min-w-0 items-baseline justify-between gap-2">
                        <dt className="text-muted-foreground">
                            Versi pencocokan
                        </dt>
                        <dd className="min-w-0 text-right font-label text-xs wrap-anywhere text-foreground">
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

            <DashboardRecommendationFeedbackActions
                recommendationId={recommendation.id}
                projectHref={projectHref}
                projectActionLabel={projectAction.label}
                profileHref={profileHref}
                profileActionLabel={profileAction.label}
                isProcessing={isProcessing}
                isStale={isStale}
                onFeedback={onFeedback}
            />
        </div>
    );
}
