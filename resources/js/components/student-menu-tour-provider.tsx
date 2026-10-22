import { router, usePage } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { StudentMenuTourCard } from '@/components/student-menu-tour-card';
import type { TourState } from '@/components/student-menu-tour-card';
import { StudentMenuTourSpotlight } from '@/components/student-menu-tour-spotlight';
import { useStudentOnboardingOpen } from '@/components/student-onboarding-context';
import { StudentTourContext } from '@/components/student-tour-context';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useStudentTourSpotlight } from '@/hooks/use-student-tour-spotlight';
import { featureGuideKey, markFeatureGuideSeen } from '@/lib/feature-guide';
import {
    getStudentTourSteps,
    studentJourneySummaryId,
    studentMenuTourId,
} from '@/lib/student-menu-tour';
import { dashboard } from '@/routes';
import { index as contributionsIndex } from '@/routes/contributions';
import { index as portfolioIndex } from '@/routes/portfolio';
import { index as projectsIndex } from '@/routes/projects';

const menuRoutes = {
    dashboard,
    projects: projectsIndex,
    contributions: contributionsIndex,
    portfolio: portfolioIndex,
};

export function StudentMenuTourProvider({
    children,
    userId,
}: {
    children: ReactNode;
    userId: number;
}) {
    const { shell } = usePage().props;
    const onboardingOpen = useStudentOnboardingOpen();
    const { isCurrentUrl } = useCurrentUrl();
    const [tour, setTour] = useState<TourState | null>(null);
    const cancelVisit = useRef<{ cancel: () => void } | null>(null);
    const requestVersion = useRef(0);
    const mounted = useRef(false);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const spotlightId = useId();
    const steps = getStudentTourSteps(
        shell.institutionMembership?.status === 'verified',
    );
    const step = tour ? steps[tour.index] : undefined;
    const atDestination = step ? isCurrentUrl(menuRoutes[step.menu]()) : false;
    const ready =
        tour !== null &&
        !tour.closing &&
        !tour.loading &&
        !tour.error &&
        atDestination &&
        !onboardingOpen;
    const { rect, settled, moving } = useStudentTourSpotlight(
        step,
        ready,
        tour?.revision ?? 0,
    );

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
            cancelVisit.current?.cancel();
        };
    }, []);

    useEffect(() => {
        if (!settled) {
            return;
        }

        const frame = window.requestAnimationFrame(() =>
            titleRef.current?.focus({ preventScroll: true }),
        );

        return () => window.cancelAnimationFrame(frame);
    }, [settled, step?.id]);

    function goTo(index: number) {
        const destination = steps[index];

        if (!destination || onboardingOpen || !mounted.current) {
            return;
        }

        const version = ++requestVersion.current;
        cancelVisit.current?.cancel();
        cancelVisit.current = null;
        const route = menuRoutes[destination.menu]();

        if (isCurrentUrl(route)) {
            setTour({ index, revision: version, loading: false, error: null });

            return;
        }

        setTour({ index, revision: version, loading: true, error: null });
        const fail = () => {
            if (requestVersion.current === version && mounted.current) {
                setTour((current) =>
                    current
                        ? {
                              ...current,
                              loading: false,
                              error: 'Menu belum dapat dibuka. Data tetap aman. Periksa koneksi atau hak akses, lalu coba lagi.',
                          }
                        : null,
                );
            }

            return false;
        };
        router.visit(route, {
            preserveScroll: true,
            onCancelToken: (token) => {
                cancelVisit.current = token;
            },
            onError: fail,
            onHttpException: fail,
            onNetworkError: fail,
            onCancel: fail,
            onFinish: () => {
                if (requestVersion.current === version && mounted.current) {
                    cancelVisit.current = null;
                    setTour((current) =>
                        current ? { ...current, loading: false } : null,
                    );
                }
            },
        });
    }

    function stopTour() {
        requestVersion.current++;
        cancelVisit.current?.cancel();
        cancelVisit.current = null;
        markFeatureGuideSeen(featureGuideKey(userId, studentJourneySummaryId));
        markFeatureGuideSeen(featureGuideKey(userId, studentMenuTourId));
        setTour((current) => (current ? { ...current, closing: true } : null));
    }

    const accessChanged = tour !== null && !step;
    const navigationError =
        tour?.error ??
        (!atDestination && !tour?.loading && step
            ? 'Kamu berada di halaman lain. Coba lagi untuk membuka menu yang sedang dikenalkan, atau lewati tur.'
            : null);

    return (
        <StudentTourContext
            value={{ active: tour !== null, startTour: () => goTo(0) }}
        >
            {children}
            <Dialog
                open={tour !== null && !tour.closing && !onboardingOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        stopTour();
                    }
                }}
            >
                <DialogPortal>
                    <DialogOverlay className="student-tour-backdrop bg-transparent motion-reduce:animate-none">
                        <StudentMenuTourSpotlight
                            spotlightId={spotlightId}
                            rect={rect}
                            settled={settled}
                        />
                    </DialogOverlay>
                    <StudentMenuTourCard
                        tour={tour}
                        step={step}
                        steps={steps}
                        moving={moving}
                        accessChanged={accessChanged}
                        navigationError={navigationError}
                        settled={settled}
                        hasRect={!!rect}
                        titleRef={titleRef}
                        onStopTour={stopTour}
                        onGoTo={goTo}
                        onCloseAutoFocus={() => {
                            setTour(null);

                            if (!onboardingOpen) {
                                document
                                    .querySelector<HTMLButtonElement>(
                                        '[data-test="student-menu-tour-trigger"]',
                                    )
                                    ?.focus({ preventScroll: true });
                            }
                        }}
                    />
                </DialogPortal>
            </Dialog>
        </StudentTourContext>
    );
}
