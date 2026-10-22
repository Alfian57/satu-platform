import { Head } from '@inertiajs/react';
import { AppPage } from '@/components/app-page';
import { DashboardAccessDenied } from '@/components/dashboard/dashboard-access-denied';
import { DashboardContextAside } from '@/components/dashboard/dashboard-context-aside';
import { DashboardHero } from '@/components/dashboard/dashboard-hero';
import { DashboardNoticeBoard } from '@/components/dashboard/dashboard-notice-board';
import { DashboardWorkspaceMain } from '@/components/dashboard/dashboard-workspace-main';
import { DashboardPendingHero } from '@/components/dashboard-pending-hero';
import { StudentJourneySummary } from '@/components/student-journey-summary';
import { actionHref, useDashboard } from '@/hooks/use-dashboard';
import { dashboard } from '@/routes';

export default function Dashboard() {
    const {
        pageProps,
        firstName,
        isStudent,
        canExploreProjects,
        isAwaitingReview,
        useReferenceLayout,
        refreshError,
        uncertainRefresh,
        dashboardForbidden,
        processingFeedback,
        isRefreshing,
        handleAction,
        handleFeedback,
        requestRecommendations,
    } = useDashboard();

    const {
        auth,
        nextAction,
        reviewQueue,
        dashboardNotice,
        activeProjects,
        recommendations,
        profileReadiness,
        institution,
        shell,
    } = pageProps;

    if (dashboardForbidden) {
        return (
            <AppPage>
                <Head title="Beranda" />
                <DashboardAccessDenied onAction={handleAction} />
            </AppPage>
        );
    }

    return (
        <>
            <Head title="Beranda" />
            <AppPage>
                <div
                    data-dashboard-surface="mascot-workspace"
                    data-dashboard-source="application"
                    data-test="dashboard-root"
                    className={
                        isAwaitingReview
                            ? 'dashboard-pending-view dashboard-ledger-view'
                            : canExploreProjects
                              ? 'dashboard-verified-view dashboard-ledger-view'
                              : undefined
                    }
                >
                    {isAwaitingReview ? (
                        <DashboardPendingHero firstName={firstName} />
                    ) : (
                        <DashboardHero
                            firstName={firstName}
                            canExploreProjects={canExploreProjects}
                        />
                    )}

                    <div className="dashboard-content-stack grid gap-6">
                        <DashboardNoticeBoard
                            isAwaitingReview={isAwaitingReview}
                            isStudent={isStudent}
                            dashboardNotice={dashboardNotice}
                            shell={shell}
                            getActionHref={actionHref}
                            onAction={handleAction}
                        />
                        <div
                            className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                            data-test="dashboard-workspace-grid"
                        >
                            <DashboardWorkspaceMain
                                nextAction={nextAction}
                                activeProjects={activeProjects}
                                useReferenceLayout={useReferenceLayout}
                                getActionHref={actionHref}
                                onAction={handleAction}
                            />
                            <DashboardContextAside
                                useReferenceLayout={useReferenceLayout}
                                isAwaitingReview={isAwaitingReview}
                                reviewQueue={reviewQueue}
                                recommendations={recommendations}
                                refreshError={refreshError}
                                uncertainRefresh={uncertainRefresh}
                                isRefreshing={isRefreshing}
                                processingFeedback={processingFeedback}
                                profileReadiness={profileReadiness}
                                institution={institution}
                                getActionHref={actionHref}
                                onAction={handleAction}
                                onFeedback={handleFeedback}
                                onRequestRecommendations={
                                    requestRecommendations
                                }
                            />
                        </div>
                        {isStudent && auth.user && (
                            <StudentJourneySummary
                                key={auth.user.id}
                                userId={auth.user.id}
                                referenceLayout={useReferenceLayout}
                            />
                        )}
                    </div>
                </div>
            </AppPage>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Beranda',
            href: dashboard(),
        },
    ],
};
