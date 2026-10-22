import { Deferred } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { DashboardContextRail } from '@/components/dashboard-context-rail';
import type { DashboardRecommendationFeedback } from '@/components/dashboard-context-rail';
import { loadingRecommendations } from '@/hooks/use-dashboard';
import type {
    DashboardAction,
    DashboardInstitution,
    DashboardProfileReadiness,
    DashboardRecommendationRegion,
    DashboardReviewQueue,
} from '@/types';

type ActionHref = NonNullable<
    ComponentProps<typeof DashboardContextRail>['getActionHref']
>;

export interface DashboardContextAsideProps {
    useReferenceLayout: boolean;
    isAwaitingReview: boolean;
    reviewQueue: DashboardReviewQueue;
    recommendations?: DashboardRecommendationRegion | null;
    refreshError: string | null;
    uncertainRefresh: boolean;
    isRefreshing: boolean;
    processingFeedback?: DashboardRecommendationFeedback | null;
    profileReadiness: DashboardProfileReadiness;
    institution: DashboardInstitution | null;
    getActionHref: ActionHref;
    onAction: (action: DashboardAction) => void;
    onFeedback: (
        recommendationId: number,
        feedback: DashboardRecommendationFeedback,
    ) => void;
    onRequestRecommendations: () => void;
}

export function DashboardContextAside({
    useReferenceLayout,
    isAwaitingReview,
    reviewQueue,
    recommendations,
    refreshError,
    uncertainRefresh,
    isRefreshing,
    processingFeedback,
    profileReadiness,
    institution,
    getActionHref,
    onAction,
    onFeedback,
    onRequestRecommendations,
}: DashboardContextAsideProps) {
    return (
        <aside aria-label="Konteks dashboard" className="min-w-0">
            <Deferred
                data="recommendations"
                fallback={
                    <DashboardContextRail
                        referenceLayout={useReferenceLayout}
                        pendingAffiliation={isAwaitingReview}
                        reviewQueue={reviewQueue}
                        recommendationRegion={loadingRecommendations()}
                        refreshError={refreshError}
                        getActionHref={getActionHref}
                        onAction={onAction}
                        onFeedback={() => undefined}
                        processingFeedback={processingFeedback}
                        profileReadiness={profileReadiness}
                        institution={institution}
                    />
                }
            >
                <DashboardContextRail
                    referenceLayout={useReferenceLayout}
                    pendingAffiliation={isAwaitingReview}
                    reviewQueue={reviewQueue}
                    recommendationRegion={
                        recommendations ?? loadingRecommendations()
                    }
                    onRefreshRecommendations={onRequestRecommendations}
                    refreshingRecommendations={isRefreshing}
                    refreshError={refreshError}
                    uncertainRefresh={uncertainRefresh}
                    getActionHref={getActionHref}
                    onAction={onAction}
                    onFeedback={onFeedback}
                    processingFeedback={processingFeedback}
                    profileReadiness={profileReadiness}
                    institution={institution}
                />
            </Deferred>
        </aside>
    );
}
