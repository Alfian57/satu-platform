import { HelpCircle } from 'lucide-react';
import { useStudentOnboardingOpen } from '@/components/onboarding/student-onboarding-context';
import { useStudentMenuTour } from '@/components/student-tour';
import { StudentJourneyGuideDialog } from '@/components/student-tour/_components/student-journey-guide-dialog';
import { StudentJourneySteps } from '@/components/student-tour/_components/student-journey-steps';
import { useStudentJourneyGuide } from '@/components/student-tour/_hooks/use-student-journey-guide';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

export function StudentJourneySummary({
    userId,
    referenceLayout = false,
}: {
    userId: number;
    referenceLayout?: boolean;
}) {
    const onboardingOpen = useStudentOnboardingOpen();
    const { active: tourActive, startTour } = useStudentMenuTour();
    const {
        open,
        triggerRef,
        handleOpenChange,
        handleStartTour,
        handleCloseAutoFocus,
    } = useStudentJourneyGuide(userId, onboardingOpen, tourActive, startTour);

    return (
        <Dialog open={open && !onboardingOpen} onOpenChange={handleOpenChange}>
            <section
                aria-labelledby="student-journey-heading"
                className="min-w-0 border-t border-border px-1 pt-7 pb-2 sm:pt-8"
                data-test="student-journey-summary"
            >
                <div className="student-journey-summary__header flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="student-journey-summary__intro min-w-0">
                        <p className="text-xs font-semibold text-primary">
                            Kenali cara kerja SATU
                        </p>
                        <h2
                            id="student-journey-heading"
                            className="mt-1 text-xl font-bold tracking-tight text-foreground"
                        >
                            Dari proyek ke portofolio
                        </h2>
                    </div>
                    <DialogTrigger asChild>
                        <Button
                            ref={triggerRef}
                            type="button"
                            variant="outline"
                            disabled={onboardingOpen}
                            className="min-h-11 w-full shrink-0 cursor-pointer rounded-xl border-border bg-white text-primary disabled:cursor-not-allowed sm:w-auto"
                            data-test="student-journey-guide-trigger"
                        >
                            <HelpCircle aria-hidden="true" className="size-4" />
                            Pahami alur SATU
                        </Button>
                    </DialogTrigger>
                </div>

                <StudentJourneySteps referenceLayout={referenceLayout} />

                <p className="student-journey-summary__note mt-4 text-sm leading-6 text-muted-foreground">
                    Tugas yang selesai belum otomatis menjadi kontribusi
                    terverifikasi. Ajukan kontribusimu untuk ditinjau kampus.
                </p>
            </section>

            <StudentJourneyGuideDialog
                onStartTour={handleStartTour}
                onCloseAutoFocus={handleCloseAutoFocus}
            />
        </Dialog>
    );
}
