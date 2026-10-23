import type { InertiaLinkProps } from '@inertiajs/react';
import { DashboardReadinessCard } from '@/pages/dashboard/_components/dashboard-readiness-card';
import { DashboardRecommendationsCard } from '@/pages/dashboard/_components/dashboard-recommendations-card';
import type { DashboardRecommendationFeedback } from '@/pages/dashboard/_components/dashboard-recommendations-card';
import { DashboardReviewQueueCard } from '@/pages/dashboard/_components/dashboard-review-queue-card';
import type {
    DashboardAction,
    DashboardInstitution,
    DashboardProfileReadiness,
    DashboardRecommendationRegion,
    DashboardReviewQueue,
} from '@/types';

export type { DashboardRecommendationFeedback };

type ActionHref = NonNullable<InertiaLinkProps['href']>;

interface DashboardContextRailProps {
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
}: DashboardContextRailProps) {
    return (
        <div
            className="grid min-w-0 content-start gap-6 lg:grid-cols-2 xl:grid-cols-1"
            data-test="dashboard-context-rail"
        >
            <DashboardRecommendationsCard
                recommendationRegion={recommendationRegion}
                pendingAffiliation={pendingAffiliation}
                getActionHref={getActionHref}
                onAction={onAction}
                onFeedback={onFeedback}
                processingFeedback={processingFeedback}
                onRefreshRecommendations={onRefreshRecommendations}
                refreshingRecommendations={refreshingRecommendations}
                refreshError={refreshError}
                uncertainRefresh={uncertainRefresh}
            />

            <div
                className={
                    referenceLayout
                        ? 'dashboard-support-card lg:col-span-2 xl:col-span-1'
                        : 'contents'
                }
            >
                <DashboardReadinessCard
                    profileReadiness={profileReadiness}
                    institution={institution}
                    referenceLayout={referenceLayout}
                />

                <DashboardReviewQueueCard reviewQueue={reviewQueue} />
            </div>
        </div>
    );
}
