import { HelpCircle } from 'lucide-react';
import { useStudentOnboardingOpen } from '@/components/onboarding/student-onboarding-context';
import { useStudentMenuTour } from '@/components/student-tour/student-tour-context';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function StudentMenuTourTrigger() {
    const { startTour } = useStudentMenuTour();
    const onboardingOpen = useStudentOnboardingOpen();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className="size-11 min-h-11 min-w-11 cursor-pointer rounded-lg border border-border bg-card p-0 text-primary shadow-xs transition-colors hover:bg-accent hover:text-primary disabled:cursor-not-allowed"
                    aria-label="Panduan menu"
                    disabled={onboardingOpen}
                    onClick={startTour}
                    data-test="student-menu-tour-trigger"
                >
                    <HelpCircle aria-hidden="true" className="size-5" />
                    <span className="sr-only">Panduan menu</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>
                <p>Panduan menu</p>
            </TooltipContent>
        </Tooltip>
    );
}
