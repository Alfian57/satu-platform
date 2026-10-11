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
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import { DashboardContextRail } from '@/components/dashboard-context-rail';
import type { DashboardRecommendationFeedback } from '@/components/dashboard-context-rail';
import { DashboardNextAction } from '@/components/dashboard-next-action';
import { DashboardProjectLedger } from '@/components/dashboard-project-ledger';
import { DashboardStateNotice } from '@/components/dashboard-state-notice';
import Mascot from '@/components/mascot';
import { StudentJourneySummary } from '@/components/student-journey-summary';
import { useStudentOnboardingLauncher } from '@/components/student-onboarding-context';
import { Button } from '@/components/ui/button';
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
    const { auth: sharedAuth, shell } = usePage().props;
    const isStudent = sharedAuth.user?.workspace.role === 'student';
    const canExploreProjects =
        isStudent && shell.institutionMembership?.status === 'verified';
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
                        'Pembaruan tidak dapat diminta. Periksa konteks kampus dan kelengkapan profil.',
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
                >
                    <header
                        className="relative isolate mb-10 rounded-4xl border border-white bg-linear-to-br from-accent via-sky-100 to-blue-100 px-5 pt-7 pb-52 shadow-md sm:mt-6 sm:min-h-80 sm:px-8 sm:py-9 lg:mt-12 lg:px-10 lg:py-10"
                        data-test="dashboard-hero"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-4xl"
                        >
                            <div className="absolute -top-24 -right-12 size-96 rounded-full border border-white/70 bg-white/30" />
                            <div className="absolute right-12 -bottom-36 h-64 w-[32rem] -rotate-12 rounded-[50%] bg-white/45" />
                            <div className="absolute -right-16 -bottom-40 h-60 w-[30rem] rotate-12 rounded-[50%] bg-primary/5" />
                            <DashboardArchiveArt className="absolute right-24 bottom-7 w-36 -rotate-6 opacity-65 sm:right-[18%] sm:bottom-9 sm:w-44 lg:right-[22%] lg:w-52" />
                            <div className="absolute top-8 right-8 h-1.5 w-12 -rotate-12 rounded-full bg-satu-feather/70" />
                        </div>
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
                                Temukan peluang, lanjutkan pekerjaan tim, dan
                                bangun portofolio dari kontribusi yang
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
                        <div className="absolute right-0 -bottom-7 z-10 w-52 sm:right-2 sm:w-[39%] sm:max-w-80 lg:right-7 lg:w-[36%] lg:max-w-96">
                            <Mascot
                                pose="welcome"
                                interactive
                                priority
                                className="w-full"
                            />
                        </div>
                    </header>

                    <div className="grid gap-6">
                        {dashboardNotice && (
                            <DashboardStateNotice
                                notice={dashboardNotice}
                                getActionHref={actionHref}
                                onAction={handleAction}
                            />
                        )}
                        {isStudent && (
                            <DashboardAffiliationNotice shell={shell} />
                        )}
                        <div
                            className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                            data-test="dashboard-workspace-grid"
                        >
                            <div className="grid min-w-0 gap-6">
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
