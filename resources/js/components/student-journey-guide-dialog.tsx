import { LockKeyhole } from 'lucide-react';
import Mascot from '@/components/mascot';
import { journeySteps } from '@/components/student-journey-steps';
import { Button } from '@/components/ui/button';
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface StudentJourneyGuideDialogProps {
    onStartTour: () => void;
    onCloseAutoFocus: (event: Event) => void;
}

export function StudentJourneyGuideDialog({
    onStartTour,
    onCloseAutoFocus,
}: StudentJourneyGuideDialogProps) {
    return (
        <DialogContent
            className="flex max-h-[90svh] flex-col gap-0 overflow-hidden rounded-3xl bg-card p-0 motion-reduce:animate-none sm:max-w-xl"
            data-test="student-journey-guide"
            onCloseAutoFocus={onCloseAutoFocus}
        >
            <DialogHeader className="shrink-0 border-b border-border/60 px-5 pt-6 pb-4 text-left sm:px-6">
                <div className="flex items-center gap-3 pr-6">
                    <Mascot pose="guide" className="w-14 shrink-0" />
                    <div className="min-w-0">
                        <DialogTitle className="text-xl leading-snug font-bold">
                            Pahami alur SATU
                        </DialogTitle>
                        <DialogDescription className="mt-1 leading-6">
                            Kenali fungsi tiap bagian sebelum mulai.
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
                <ol className="grid gap-4">
                    {journeySteps.map((step, index) => {
                        const Icon = step.icon;

                        return (
                            <li key={step.title} className="flex gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                                    <Icon
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-foreground">
                                        {index + 1}. {step.title}
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        {step.explanation}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
                <div className="mt-5 flex gap-3 rounded-2xl border border-border bg-background p-4">
                    <LockKeyhole
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <p className="text-sm leading-6 text-muted-foreground">
                        Kamu mengendalikan visibilitas melalui pengaturan profil
                        dan setiap karya pada portofolio. Persetujuan kontribusi
                        tidak otomatis memublikasikan karya.
                    </p>
                </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-border/60 bg-card px-5 py-4 sm:px-6">
                <DialogClose asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 cursor-pointer rounded-xl text-muted-foreground"
                        data-test="student-journey-guide-skip"
                    >
                        Lewati
                    </Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button
                        type="button"
                        className="min-h-11 cursor-pointer rounded-xl"
                        data-test="student-journey-guide-understood"
                        onClick={onStartTour}
                    >
                        Mulai tur
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
}
