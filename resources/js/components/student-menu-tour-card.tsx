import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import type { RefObject } from 'react';
import Mascot from '@/components/mascot';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { getStudentTourSteps } from '@/lib/student-menu-tour';

type TourSteps = ReturnType<typeof getStudentTourSteps>;
type TourStep = TourSteps[number];

export interface TourState {
    index: number;
    revision: number;
    loading: boolean;
    error: string | null;
    closing?: boolean;
}

export interface StudentMenuTourCardProps {
    tour: TourState | null;
    step: TourStep | undefined;
    steps: TourSteps;
    moving: boolean;
    accessChanged: boolean;
    navigationError: string | null;
    settled: boolean;
    hasRect: boolean;
    titleRef: RefObject<HTMLHeadingElement | null>;
    onStopTour: () => void;
    onGoTo: (index: number) => void;
    onCloseAutoFocus: () => void;
}

export function StudentMenuTourCard({
    tour,
    step,
    steps,
    moving,
    accessChanged,
    navigationError,
    settled,
    hasRect,
    titleRef,
    onStopTour,
    onGoTo,
    onCloseAutoFocus,
}: StudentMenuTourCardProps) {
    return (
        <DialogPrimitive.Content
            className="student-tour-panel fixed right-3 bottom-3 left-3 z-50 flex h-[28rem] max-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-3xl border border-white bg-card shadow-lg focus:outline-none sm:right-6 sm:bottom-6 sm:left-auto sm:h-[26rem] sm:w-[25rem]"
            data-test="student-menu-tour"
            data-tour-step={step?.id ?? 'access-changed'}
            data-moving={moving || tour?.loading || false}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => {
                event.preventDefault();
                onCloseAutoFocus();
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
                    onClick={onStopTour}
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
                            data-complete={tour !== null && index < tour.index}
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
                    {accessChanged ? 'Akses menu telah berubah' : step?.title}
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
                {settled && !hasRect && (
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        Bagian ini belum tersedia pada tampilan saat ini. Kamu
                        tetap dapat membaca penjelasan dan melanjutkan tur.
                    </p>
                )}
            </div>
            <div className="mx-5 flex shrink-0 flex-wrap items-center gap-2 border-t border-border pt-4 pb-5">
                <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 cursor-pointer rounded-xl text-muted-foreground"
                    onClick={onStopTour}
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
                                onGoTo(tour.index - 1);
                            }
                        }}
                        data-test="student-menu-tour-previous"
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
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
                                    onGoTo(tour.index);
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
                            disabled={tour?.loading || moving || accessChanged}
                            onClick={() => {
                                if (tour && tour.index < steps.length - 1) {
                                    onGoTo(tour.index + 1);
                                } else {
                                    onStopTour();
                                }
                            }}
                            data-test="student-menu-tour-next"
                        >
                            {tour?.index === steps.length - 1
                                ? 'Selesai'
                                : 'Berikutnya'}
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Button>
                    )}
                </div>
            </div>
        </DialogPrimitive.Content>
    );
}
