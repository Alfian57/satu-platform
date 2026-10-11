import { router, usePage } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, HelpCircle, X } from 'lucide-react';
import {
    createContext,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';
import Mascot from '@/components/mascot';
import { useStudentOnboardingOpen } from '@/components/student-onboarding-context';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
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

type TourState = {
    index: number;
    revision: number;
    loading: boolean;
    error: string | null;
    closing?: boolean;
};

const StudentTourContext = createContext({
    active: false,
    startTour: () => {},
});

export function useStudentMenuTour() {
    return useContext(StudentTourContext);
}

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
                        <svg
                            aria-hidden="true"
                            className="pointer-events-none fixed inset-0 size-full"
                        >
                            <defs>
                                <mask
                                    id={spotlightId}
                                    maskUnits="userSpaceOnUse"
                                >
                                    <rect
                                        width="100%"
                                        height="100%"
                                        fill="white"
                                    />
                                    <rect
                                        x={rect?.left ?? 0}
                                        y={rect?.top ?? 0}
                                        width={rect?.width ?? 0}
                                        height={rect?.height ?? 0}
                                        rx="24"
                                        fill="black"
                                        className="student-tour-cutout"
                                        data-visible={settled && !!rect}
                                    />
                                </mask>
                            </defs>
                            <rect
                                width="100%"
                                height="100%"
                                fill="rgb(23 52 90 / 0.38)"
                                mask={`url(#${spotlightId})`}
                            />
                        </svg>
                        <div
                            aria-hidden="true"
                            data-test="student-menu-tour-spotlight"
                            className="student-tour-spotlight pointer-events-none fixed rounded-3xl border-2 border-white/90"
                            data-visible={settled && !!rect}
                            style={{
                                ...rect,
                                boxShadow:
                                    '0 0 0 1px rgb(23 100 232 / 0.6), 0 0 0 5px rgb(231 242 255 / 0.35), 0 12px 36px rgb(23 100 232 / 0.16)',
                            }}
                        />
                    </DialogOverlay>
                    <DialogPrimitive.Content
                        className="student-tour-panel fixed right-3 bottom-3 left-3 z-50 flex h-[28rem] max-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-3xl border border-white bg-card shadow-lg focus:outline-none sm:right-6 sm:bottom-6 sm:left-auto sm:h-[26rem] sm:w-[25rem]"
                        data-test="student-menu-tour"
                        data-tour-step={step?.id ?? 'access-changed'}
                        data-moving={moving || tour?.loading || false}
                        onPointerDownOutside={(event) => event.preventDefault()}
                        onInteractOutside={(event) => event.preventDefault()}
                        onCloseAutoFocus={(event) => {
                            event.preventDefault();
                            setTour(null);

                            if (!onboardingOpen) {
                                document
                                    .querySelector<HTMLButtonElement>(
                                        '[data-test="student-menu-tour-trigger"]',
                                    )
                                    ?.focus({ preventScroll: true });
                            }
                        }}
                    >
                        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-accent/60 px-5 py-3">
                            <div className="relative size-14 shrink-0 rounded-2xl border border-white bg-white/75">
                                <Mascot
                                    pose="guide"
                                    className="absolute -top-1 -left-1 size-16"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Jelajahi SATU
                                </p>
                                <p
                                    className="mt-0.5 text-sm font-semibold text-primary"
                                    aria-live="polite"
                                    aria-atomic="true"
                                >
                                    {step?.menuLabel ?? 'Akses berubah'}
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Tutup tur menu"
                                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-primary"
                                onClick={stopTour}
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        </div>
                        <div className="shrink-0 px-5 pt-4">
                            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span>Panduan menu</span>
                                <span>
                                    {tour && step
                                        ? `Langkah ${tour.index + 1} dari ${steps.length}`
                                        : 'Akses berubah'}
                                </span>
                            </div>
                            <div aria-hidden="true" className="mt-2 flex gap-1">
                                {steps.map((item, index) => (
                                    <span
                                        key={item.id}
                                        className="student-tour-progress h-1 min-w-0 flex-1 rounded-full bg-border"
                                        data-current={tour?.index === index}
                                        data-complete={
                                            tour !== null && index < tour.index
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                        <div
                            key={step?.id ?? 'access-changed'}
                            className="student-tour-copy min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-3"
                        >
                            <DialogTitle
                                ref={titleRef}
                                tabIndex={-1}
                                className="text-xl leading-snug font-bold tracking-tight focus:outline-none"
                            >
                                {accessChanged
                                    ? 'Akses menu telah berubah'
                                    : step?.title}
                            </DialogTitle>
                            <DialogDescription className="mt-3 text-sm leading-6">
                                {accessChanged
                                    ? 'Tur tidak membuka menu yang aksesnya sudah tidak tersedia. Tutup tur dan periksa status afiliasi kampusmu.'
                                    : step?.description}
                            </DialogDescription>
                            {tour?.loading && (
                                <p
                                    role="status"
                                    className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                    <Spinner />
                                    Membuka menu {step?.menuLabel}.
                                </p>
                            )}
                            {navigationError && (
                                <p
                                    role="alert"
                                    className="mt-3 rounded-xl bg-correction-subtle p-3 text-sm leading-6 text-correction-subtle-foreground"
                                >
                                    {navigationError}
                                </p>
                            )}
                            {settled && !rect && (
                                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                                    Bagian ini belum tersedia pada tampilan saat
                                    ini. Kamu tetap dapat membaca penjelasan dan
                                    melanjutkan tur.
                                </p>
                            )}
                        </div>
                        <div className="mx-5 flex shrink-0 flex-wrap items-center gap-2 border-t border-border pt-4 pb-5">
                            <Button
                                type="button"
                                variant="ghost"
                                className="min-h-11 cursor-pointer rounded-xl text-muted-foreground"
                                onClick={stopTour}
                                data-test="student-menu-tour-skip"
                            >
                                Lewati
                            </Button>
                            <div className="ml-auto flex flex-wrap justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="min-h-11 min-w-11 cursor-pointer rounded-xl px-3 disabled:cursor-not-allowed"
                                    disabled={
                                        !tour ||
                                        tour.index === 0 ||
                                        tour.loading ||
                                        moving ||
                                        accessChanged
                                    }
                                    onClick={() => {
                                        if (tour) {
                                            goTo(tour.index - 1);
                                        }
                                    }}
                                    data-test="student-menu-tour-previous"
                                >
                                    <ArrowLeft
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    <span className="sr-only sm:not-sr-only">
                                        Sebelumnya
                                    </span>
                                </Button>
                                {navigationError && !accessChanged ? (
                                    <Button
                                        type="button"
                                        className="min-h-11 cursor-pointer rounded-xl"
                                        onClick={() => {
                                            if (tour) {
                                                goTo(tour.index);
                                            }
                                        }}
                                        data-test="student-menu-tour-retry"
                                    >
                                        Coba lagi
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        className="min-h-11 cursor-pointer rounded-xl px-3 disabled:cursor-not-allowed"
                                        disabled={
                                            tour?.loading ||
                                            moving ||
                                            accessChanged
                                        }
                                        onClick={() => {
                                            if (
                                                tour &&
                                                tour.index < steps.length - 1
                                            ) {
                                                goTo(tour.index + 1);
                                            } else {
                                                stopTour();
                                            }
                                        }}
                                        data-test="student-menu-tour-next"
                                    >
                                        {tour?.index === steps.length - 1
                                            ? 'Selesai'
                                            : 'Berikutnya'}
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPortal>
            </Dialog>
        </StudentTourContext>
    );
}

export function StudentMenuTourTrigger() {
    const { startTour } = useStudentMenuTour();
    const onboardingOpen = useStudentOnboardingOpen();

    return (
        <Button
            type="button"
            variant="ghost"
            className="min-h-11 min-w-11 cursor-pointer rounded-full bg-white/70 px-3 text-primary disabled:cursor-not-allowed"
            aria-label="Buka panduan menu mahasiswa"
            disabled={onboardingOpen}
            onClick={startTour}
            data-test="student-menu-tour-trigger"
        >
            <HelpCircle aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Panduan menu</span>
        </Button>
    );
}
