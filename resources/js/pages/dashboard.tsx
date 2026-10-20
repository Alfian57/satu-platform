import {
    Deferred,
    Head,
    Link,
    router,
    useHttp,
    usePage,
} from '@inertiajs/react';
import { ArrowDown, ArrowUpRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import { DashboardAffiliationNotice } from '@/components/dashboard-affiliation-notice';
import { DashboardContextRail } from '@/components/dashboard-context-rail';
import type { DashboardRecommendationFeedback } from '@/components/dashboard-context-rail';
import { DashboardNextAction } from '@/components/dashboard-next-action';
import { DashboardPendingHero } from '@/components/dashboard-pending-hero';
import { DashboardProjectLedger } from '@/components/dashboard-project-ledger';
import { DashboardStateNotice } from '@/components/dashboard-state-notice';
import StudentHeroBackdrop from '@/components/student-hero-backdrop';
import StudentHeroMascot from '@/components/student-hero-mascot';
import { StudentJourneySummary } from '@/components/student-journey-summary';
import { useStudentOnboardingLauncher } from '@/components/student-onboarding-context';
import { Button } from '@/components/ui/button';
import { isAffiliationAwaitingReview } from '@/lib/student-activation';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { show as contributionShow } from '@/routes/contributions';
import {
    hide as hideRecommendation,
    notRelevant as markRecommendationNotRelevant,
    profileFix as markRecommendationProfileFix,
    refresh as refreshRecommendations,
} from '@/routes/dashboard/recommendations';
import {
    index as projectsIndex,
    show as projectShow,
    workspace as projectWorkspace,
} from '@/routes/projects';
import { edit as editCapabilities } from '@/routes/student-profiles';
import type {
    DashboardAction,
    DashboardPageProps,
    DashboardProjectsRegion,
    DashboardRecommendationRegion,
} from '@/types';
import type { StudentActivation } from '@/types/onboarding';

type DashboardRoute = ReturnType<typeof dashboard>;

function actionHref(action: DashboardAction): DashboardRoute | null {
    switch (action.key) {
        case 'onboarding':
            return null;
        case 'profile':
            return editCapabilities();
        case 'projects':
            return projectsIndex({ query: { view: action.view } });
        case 'project':
            return action.projectId === undefined
                ? null
                : projectShow(action.projectId);
        case 'workspace':
            return action.projectId === undefined
                ? null
                : projectWorkspace(action.projectId, {
                      query: { task: action.taskId ?? null },
                  });
        case 'contribution':
            return action.contributionId === undefined
                ? null
                : contributionShow(action.contributionId);
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
    const {
        auth: sharedAuth,
        shell,
        onboarding,
    } = usePage<{
        onboarding?: StudentActivation | null;
        [key: string]: unknown;
    }>().props;
    const isStudent = sharedAuth.user?.workspace.role === 'student';
    const canExploreProjects =
        isStudent && shell.institutionMembership?.status === 'verified';
    const isAwaitingReview =
        isStudent &&
        shell.institutionMembership?.status === 'pending' &&
        isAffiliationAwaitingReview(onboarding);
    const useReferenceLayout = isAwaitingReview || canExploreProjects;
    const openOnboarding = useStudentOnboardingLauncher();
    const refreshForm = useHttp<
        { institution_id: number },
        { data: { state: string } }
    >({ institution_id: institution?.id ?? 0 });
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [uncertainRefresh, setUncertainRefresh] = useState(false);
    const [dashboardForbidden, setDashboardForbidden] = useState(false);

    function reloadRecommendations(restoreFocus = false) {
        router.reload({
            only: [
                'nextAction',
                'dashboardNotice',
                'recommendations',
                'refreshedAt',
            ],
            onSuccess: () => {
                setRefreshError(null);
                setUncertainRefresh(false);

                if (restoreFocus) {
                    document.getElementById('recommendation-heading')?.focus();
                }
            },
            onHttpException: (response) => {
                if (response.status === 403 || response.status === 404) {
                    setDashboardForbidden(true);
                }

                setRefreshError(
                    'Status terbaru belum dapat dibaca. Periksa akses dan coba muat ulang.',
                );

                return false;
            },
            onNetworkError: () => {
                setRefreshError(
                    'Status terbaru belum dapat dibaca. Periksa koneksi dan coba muat ulang.',
                );

                return false;
            },
        });
    }

    function requestRecommendations() {
        if (
            refreshForm.processing ||
            uncertainRefresh ||
            !institution ||
            !canExploreProjects
        ) {
            return;
        }

        setRefreshError(null);
        const restoreFocus =
            document.activeElement?.getAttribute('data-test') ===
            'dashboard-request-recommendations';
        refreshForm.transform(() => ({ institution_id: institution.id }));
        refreshForm
            .post(refreshRecommendations().url, {
                onSuccess: () => reloadRecommendations(restoreFocus),
                onError: () => {
                    setRefreshError(
                        'Pembaruan tidak dapat diminta. Periksa status afiliasi dan kelengkapan profil.',
                    );
                },
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        setDashboardForbidden(true);
                    }

                    setUncertainRefresh(true);
                    setRefreshError(
                        'Hasil permintaan belum dapat dipastikan. Periksa status sebelum meminta lagi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setUncertainRefresh(true);
                    setRefreshError(
                        'Hasil permintaan belum dapat dipastikan. Periksa koneksi, lalu periksa status sebelum meminta lagi.',
                    );

                    return false;
                },
            })
            .catch(() => undefined);
    }

    function handleAction(action: DashboardAction) {
        if (action.key === 'onboarding') {
            openOnboarding();
        }

        if (action.key === 'refresh') {
            reloadRecommendations();

            return;
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

    if (dashboardForbidden) {
        return (
            <AppPage>
                <Head title="Beranda" />
                <section
                    className="rounded-3xl border border-border bg-card p-6"
                    data-test="dashboard-access-denied"
                >
                    <h1 className="text-title font-semibold">
                        Akses Beranda berubah
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Informasi sebelumnya tidak ditampilkan. Periksa afiliasi
                        kampus sebelum melanjutkan.
                    </p>
                    <Button
                        type="button"
                        className="mt-4"
                        onClick={openOnboarding}
                    >
                        Periksa afiliasi
                    </Button>
                </section>
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
                        <header
                            className={cn(
                                'student-hero-home relative isolate mb-10 rounded-4xl border border-white px-5 pt-7 pb-52 shadow-md sm:min-h-80 sm:px-8 sm:py-9 lg:px-10 lg:py-10',
                                canExploreProjects
                                    ? 'sm:mt-4 lg:mt-6'
                                    : 'sm:mt-6 lg:mt-12',
                            )}
                            data-test="dashboard-hero"
                        >
                            <StudentHeroBackdrop theme="home" />
                            <div className="relative z-10 sm:max-w-[55%] lg:max-w-[60%]">
                                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary">
                                    <Sparkles
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    Ruang kolaborasimu
                                </p>
                                <h1 className="text-3xl leading-[1.12] font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
                                    Halo,{' '}
                                    <span className="wrap-anywhere text-primary">
                                        {firstName}!
                                    </span>
                                </h1>
                                <p className="mt-4 max-w-[28rem] text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                                    Temukan peluang, lanjutkan pekerjaan tim,
                                    dan bangun portofolio dari kontribusi yang
                                    terverifikasi.
                                </p>
                                <div className="mt-6 flex flex-wrap gap-2.5">
                                    <Button
                                        asChild
                                        className="group min-h-11 w-full rounded-xl px-5 shadow-sm hover:shadow-md motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-standard motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 sm:w-auto"
                                    >
                                        <a href="#dashboard-next-action">
                                            Lihat langkah utama
                                            <ArrowDown
                                                aria-hidden="true"
                                                className="size-4 motion-safe:transition-transform motion-safe:duration-standard motion-safe:group-hover:translate-y-0.5"
                                            />
                                        </a>
                                    </Button>
                                    {canExploreProjects && (
                                        <Button
                                            asChild
                                            variant="ghost"
                                            className="min-h-11 w-full rounded-xl bg-white/65 px-4 text-primary hover:bg-white sm:w-auto"
                                        >
                                            <Link
                                                href={projectsIndex()}
                                                data-test="dashboard-explore-projects"
                                            >
                                                Jelajahi proyek
                                                <ArrowUpRight
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <StudentHeroMascot pose="welcome" interactive />
                        </header>
                    )}

                    <div className="dashboard-content-stack grid gap-6">
                        <div
                            className={
                                isAwaitingReview
                                    ? 'dashboard-affiliation-board'
                                    : 'contents'
                            }
                        >
                            {dashboardNotice && (
                                <DashboardStateNotice
                                    notice={dashboardNotice}
                                    affiliationReview={
                                        isAwaitingReview &&
                                        dashboardNotice.action?.key ===
                                            'onboarding'
                                    }
                                    getActionHref={actionHref}
                                    onAction={handleAction}
                                />
                            )}
                            {isStudent && (
                                <DashboardAffiliationNotice shell={shell} />
                            )}
                        </div>
                        <div
                            className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                            data-test="dashboard-workspace-grid"
                        >
                            <div className="dashboard-workspace-main grid min-w-0 gap-6">
                                <DashboardNextAction
                                    action={nextAction}
                                    referenceLayout={useReferenceLayout}
                                    getActionHref={actionHref}
                                    onAction={handleAction}
                                />
                                <Deferred
                                    data="activeProjects"
                                    fallback={
                                        <DashboardProjectLedger
                                            region={loadingProjects()}
                                            referenceLayout={useReferenceLayout}
                                            getActionHref={actionHref}
                                            onAction={handleAction}
                                        />
                                    }
                                >
                                    <DashboardProjectLedger
                                        referenceLayout={useReferenceLayout}
                                        region={
                                            activeProjects ?? loadingProjects()
                                        }
                                        getActionHref={actionHref}
                                        onAction={handleAction}
                                    />
                                </Deferred>
                            </div>
                            <aside
                                aria-label="Konteks dashboard"
                                className="min-w-0"
                            >
                                <Deferred
                                    data="recommendations"
                                    fallback={
                                        <DashboardContextRail
                                            referenceLayout={useReferenceLayout}
                                            pendingAffiliation={
                                                isAwaitingReview
                                            }
                                            reviewQueue={reviewQueue}
                                            recommendationRegion={loadingRecommendations()}
                                            refreshError={refreshError}
                                            getActionHref={actionHref}
                                            onAction={handleAction}
                                            onFeedback={() => undefined}
                                            processingFeedback={
                                                processingFeedback
                                            }
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
                                            recommendations ??
                                            loadingRecommendations()
                                        }
                                        onRefreshRecommendations={
                                            requestRecommendations
                                        }
                                        refreshingRecommendations={
                                            refreshForm.processing
                                        }
                                        refreshError={refreshError}
                                        uncertainRefresh={uncertainRefresh}
                                        getActionHref={actionHref}
                                        onAction={handleAction}
                                        onFeedback={handleFeedback}
                                        processingFeedback={processingFeedback}
                                        profileReadiness={profileReadiness}
                                        institution={institution}
                                    />
                                </Deferred>
                            </aside>
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
