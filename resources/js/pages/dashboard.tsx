import { Deferred, Head, router, usePage } from '@inertiajs/react';
import { ArrowDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import { DashboardContextRail } from '@/components/dashboard-context-rail';
import type { DashboardRecommendationFeedback } from '@/components/dashboard-context-rail';
import { DashboardNextAction } from '@/components/dashboard-next-action';
import { DashboardProjectLedger } from '@/components/dashboard-project-ledger';
import { DashboardStateNotice } from '@/components/dashboard-state-notice';
import Mascot from '@/components/mascot';
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
        announcement: 'Memuat daftar proyek aktif.',
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
        profileReadiness,
        institution,
    } = usePage<DashboardPageProps>().props;
    const firstName =
        auth.user?.name.trim().split(/\s+/).find(Boolean) ?? 'mahasiswa';
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
            <Head title="Beranda" />
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
                                profileReadiness={profileReadiness}
                                institution={institution}
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
                            profileReadiness={profileReadiness}
                            institution={institution}
                        />
                    </Deferred>
                }
                contextRailLabel="Konteks dashboard"
                className="gap-0 xl:gap-1"
            >
                <div
                    data-dashboard-surface="mascot-workspace"
                    data-dashboard-source="application"
                    data-test="dashboard-root"
                >
                    <header className="relative isolate mt-4 mb-10 min-h-96 rounded-3xl border border-white/80 bg-linear-to-br from-sky-100 via-blue-100 to-sky-200 px-5 pt-7 pb-48 shadow-sm sm:mt-8 sm:min-h-80 sm:px-7 sm:py-8 lg:px-8">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl"
                        >
                            <div className="absolute -top-12 -right-8 size-64 rounded-full bg-white/40" />
                            <div className="absolute right-24 -bottom-20 h-32 w-96 -rotate-12 rounded-[50%] bg-white/50" />
                            <div className="absolute -right-20 -bottom-24 h-36 w-96 rotate-12 rounded-[50%] bg-sky-300/40" />
                        </div>
                        <div className="relative z-10 sm:max-w-[52%] lg:max-w-[58%]">
                            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-xs">
                                <Sparkles
                                    aria-hidden="true"
                                    className="size-3.5"
                                />
                                Ruang tumbuhmu
                            </p>
                            <h1 className="text-3xl leading-[1.12] font-bold tracking-tight text-slate-950 sm:text-4xl">
                                Halo,{' '}
                                <span className="wrap-anywhere text-primary">
                                    {firstName}!
                                </span>
                            </h1>
                            <p className="mt-3 max-w-80 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                                Mulai dari satu langkah yang paling membutuhkan
                                perhatianmu, lalu lanjutkan kolaborasimu.
                            </p>
                            <a
                                href="#dashboard-next-action"
                                className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none"
                            >
                                Lihat langkah utama
                                <ArrowDown
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </a>
                        </div>
                        <div className="absolute right-0 -bottom-7 z-10 w-52 sm:-right-3 sm:-bottom-7 sm:w-[44%] sm:max-w-80 lg:w-[48%]">
                            <Mascot
                                pose="welcome"
                                interactive
                                priority
                                className="w-full"
                            />
                        </div>
                    </header>

                    <div className="grid gap-7">
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
