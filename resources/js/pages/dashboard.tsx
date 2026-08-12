import { Deferred, Head, router, usePage } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import { DashboardContextRail } from '@/components/dashboard-context-rail';
import type { DashboardRecommendationFeedback } from '@/components/dashboard-context-rail';
import { DashboardNextAction } from '@/components/dashboard-next-action';
import { DashboardProjectLedger } from '@/components/dashboard-project-ledger';
import { DashboardStateNotice } from '@/components/dashboard-state-notice';
import { dashboard } from '@/routes';
import {
    hide as hideRecommendation,
    notRelevant as markRecommendationNotRelevant,
    profileFix as markRecommendationProfileFix,
} from '@/routes/dashboard/recommendations';
import { show as onboarding } from '@/routes/onboarding';
import { index as projectsIndex, show as projectShow } from '@/routes/projects';
import type {
    DashboardAction,
    DashboardPageProps,
    DashboardProjectsRegion,
    DashboardRecommendationRegion,
} from '@/types';

type DashboardRoute = ReturnType<typeof onboarding>;

function actionHref(action: DashboardAction): DashboardRoute | null {
    switch (action.key) {
        case 'onboarding':
            return onboarding();
        case 'projects':
            return projectsIndex();
        case 'project':
            return action.projectId === undefined
                ? null
                : projectShow(action.projectId);
        case 'refresh':
            return null;
    }
}

function loadingProjects(): DashboardProjectsRegion {
    return {
        state: 'loading',
        announcement: 'Memuat daftar project aktif.',
    };
}

function loadingRecommendations(): DashboardRecommendationRegion {
    return {
        state: 'loading',
        announcement: 'Memuat recommendation project.',
    };
}

export default function Dashboard() {
    const {
        auth,
        nextAction,
        reviewQueue,
        dashboardNotice,
        activeProjects,
        recommendations,
    } = usePage<DashboardPageProps>().props;
    const firstName = auth.user?.name.trim().split(/\s+/)[0] ?? 'mahasiswa';
    const [processingFeedback, setProcessingFeedback] =
        useState<DashboardRecommendationFeedback | null>(null);

    function handleAction(action: DashboardAction) {
        if (action.key === 'refresh') {
            router.reload({
                only: [
                    'nextAction',
                    'dashboardNotice',
                    'activeProjects',
                    'recommendations',
                    'refreshedAt',
                ],
            });
        }
    }

    function handleFeedback(
        recommendationId: number,
        type: DashboardRecommendationFeedback,
    ) {
        const feedbackRoutes = {
            hide: hideRecommendation,
            notRelevant: markRecommendationNotRelevant,
            profileFix: markRecommendationProfileFix,
        } as const;

        setProcessingFeedback(type);
        router.post(
            feedbackRoutes[type](recommendationId),
            {},
            {
                only: ['nextAction', 'dashboardNotice', 'recommendations'],
                preserveScroll: true,
                onFinish: () => setProcessingFeedback(null),
            },
        );
    }

    return (
        <>
            <Head title="Dashboard" />
            <AppPage
                contextRail={
                    <Deferred
                        data="recommendations"
                        fallback={
                            <DashboardContextRail
                                reviewQueue={reviewQueue}
                                recommendationRegion={loadingRecommendations()}
                                getActionHref={actionHref}
                                onAction={handleAction}
                                onFeedback={() => undefined}
                                processingFeedback={processingFeedback}
                            />
                        }
                    >
                        <DashboardContextRail
                            reviewQueue={reviewQueue}
                            recommendationRegion={
                                recommendations ?? loadingRecommendations()
                            }
                            getActionHref={actionHref}
                            onAction={handleAction}
                            onFeedback={handleFeedback}
                            processingFeedback={processingFeedback}
                        />
                    </Deferred>
                }
                contextRailLabel="Konteks dashboard"
            >
                <div
                    data-dashboard-source="application"
                    data-test="dashboard-root"
                >
                    <header className="mb-6 grid gap-4 xl:mb-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(14rem,0.75fr)] xl:items-end xl:gap-8">
                        <div>
                            <p className="text-body text-muted-foreground">
                                Selamat datang kembali, {firstName}.
                            </p>
                            <h1 className="mt-2 max-w-[24ch] text-headline font-bold text-balance xl:max-w-none">
                                Yang perlu kamu selesaikan
                            </h1>
                        </div>

                        <div className="flex max-w-2xl items-center gap-3 rounded-lg border border-border/80 bg-card/60 px-3.5 py-2.5 text-xs text-muted-foreground shadow-2xs backdrop-blur-xs xl:max-w-none">
                            <Info
                                aria-hidden="true"
                                className="size-4 shrink-0 text-primary"
                            />
                            <p className="leading-relaxed">
                                Ringkasan ini memakai data akun dan konteks
                                kampus yang tersedia.
                            </p>
                        </div>
                    </header>

                    <div className="grid gap-7 xl:gap-6">
                        {dashboardNotice && (
                            <DashboardStateNotice
                                notice={dashboardNotice}
                                getActionHref={actionHref}
                                onAction={handleAction}
                            />
                        )}
                        <DashboardNextAction
                            action={nextAction}
                            getActionHref={actionHref}
                            onAction={handleAction}
                        />
                        <Deferred
                            data="activeProjects"
                            fallback={
                                <DashboardProjectLedger
                                    region={loadingProjects()}
                                    getActionHref={actionHref}
                                    onAction={handleAction}
                                />
                            }
                        >
                            <DashboardProjectLedger
                                region={activeProjects ?? loadingProjects()}
                                getActionHref={actionHref}
                                onAction={handleAction}
                            />
                        </Deferred>
                    </div>
                </div>
            </AppPage>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
