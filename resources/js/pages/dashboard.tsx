import { Deferred, Head, router, usePage } from '@inertiajs/react';
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
import { index as projectsIndex, show as projectShow } from '@/routes/projects';
import type {
    DashboardAction,
    DashboardPageProps,
    DashboardProjectsRegion,
    DashboardRecommendationRegion,
} from '@/types';

type DashboardRoute = ReturnType<typeof dashboard>;

function actionHref(action: DashboardAction): DashboardRoute | null {
    switch (action.key) {
        case 'onboarding':
            return dashboard();
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
        announcement: 'Memuat rekomendasi proyek.',
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
                    data-dashboard-surface="active-docket"
                    data-dashboard-source="application"
                    data-test="dashboard-root"
                >
                    <header className="relative isolate mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-5 py-6 shadow-xs sm:px-7 sm:py-6">
                        <div className="relative grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.72fr)] 2xl:items-center 2xl:gap-8">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                    Selamat datang, {firstName}.
                                </h1>
                                <p className="mt-2.5 max-w-[60ch] text-sm leading-6 text-slate-600">
                                    Mulai dari satu langkah yang paling
                                    membutuhkan perhatianmu. Project,
                                    rekomendasi, dan tindak lanjutmu tersusun
                                    dalam satu ruang kerja.
                                </p>
                            </div>

                            <div
                                className="hidden border-l border-slate-200/80 pl-8 2xl:flex 2xl:flex-col 2xl:justify-center"
                                data-test="dashboard-work-note"
                            >
                                <p className="flex items-center gap-2.5 font-label text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    <span
                                        aria-hidden="true"
                                        className="h-px w-5 bg-primary"
                                    />
                                    Ritme hari ini
                                </p>
                                <p className="mt-2 text-base leading-6 font-bold text-slate-900">
                                    Mulai dari langkah utama, lalu lanjutkan
                                    project aktifmu.
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Prioritas berikutnya sudah tersusun di
                                    bawah.
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className="grid gap-8 xl:gap-5">
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
            title: 'Beranda',
            href: dashboard(),
        },
    ],
};
