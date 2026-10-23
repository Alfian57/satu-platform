import { HelpCircle } from 'lucide-react';
import { useStudentOnboardingOpen } from '@/components/onboarding/student-onboarding-context';
import { useStudentMenuTour } from '@/components/student-tour/student-tour-context';
import { Button } from '@/components/ui/button';

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
