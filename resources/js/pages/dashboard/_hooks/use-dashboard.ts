import { router, useHttp, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useStudentOnboardingLauncher } from '@/components/onboarding/student-onboarding-context';
import { isAffiliationAwaitingReview } from '@/lib/student-activation';
import type { DashboardRecommendationFeedback } from '@/pages/dashboard/_components/dashboard-context-rail';
import type { dashboard } from '@/routes';
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

export function actionHref(action: DashboardAction): DashboardRoute | null {
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

export function loadingProjects(): DashboardProjectsRegion {
    return {
        state: 'loading',
        announcement: 'Memuat daftar proyek aktif.',
    };
}

export function loadingRecommendations(): DashboardRecommendationRegion {
    return {
        state: 'loading',
        announcement: 'Memuat rekomendasi proyek.',
    };
}

export function useDashboard() {
    const pageProps = usePage<DashboardPageProps>().props;
    const { auth, institution } = pageProps;

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

    return {
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
        isRefreshing: refreshForm.processing,
        actionHref,
        handleAction,
        handleFeedback,
        requestRecommendations,
        reloadRecommendations,
    };
}
