import {
    BookOpenCheck,
    BriefcaseBusiness,
    FileCheck2,
    HelpCircle,
    LockKeyhole,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Mascot from '@/components/mascot';
import { useStudentMenuTour } from '@/components/student-menu-tour';
import { useStudentOnboardingOpen } from '@/components/student-onboarding-context';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    featureGuideKey,
    hasSeenFeatureGuide,
    markFeatureGuideSeen,
    subscribeToFeatureGuides,
} from '@/lib/feature-guide';
import {
    studentJourneySummaryId,
    studentMenuTourId,
} from '@/lib/student-menu-tour';

const journeySteps = [
    {
        title: 'Proyek',
        icon: BriefcaseBusiness,
        summary: 'Temukan peluang dan bekerja bersama tim.',
        explanation:
            'Temukan proyek yang sesuai, ajukan bergabung, lalu kerjakan tugas bersama tim setelah diterima. Tugas membantu mengatur pekerjaan dalam proyek.',
    },
    {
        title: 'Kontribusi',
        icon: FileCheck2,
        summary: 'Ajukan hasil pekerjaan beserta bukti.',
        explanation:
            'Catat hasil pekerjaanmu dan ajukan bukti melalui Kontribusi. Menyelesaikan tugas belum otomatis membuat kontribusimu terverifikasi.',
    },
    {
        title: 'Validasi kampus',
        icon: ShieldCheck,
        summary: 'Kampus meninjau kontribusi yang diajukan.',
        explanation:
            'Peninjau kampus dapat menyetujui, meminta revisi, atau menolak kontribusi. Jika diminta revisi, perbaiki pengajuan sesuai alasan yang diberikan.',
    },
    {
        title: 'Portofolio',
        icon: BookOpenCheck,
        summary: 'Tampilkan kontribusi sesuai pilihan visibilitasmu.',
        explanation:
            'Kontribusi yang disetujui dapat menjadi entri portofolio terverifikasi. Kamu tetap memilih visibilitasnya; persetujuan kampus tidak otomatis memublikasikan portofolio.',
    },
];

export function StudentJourneySummary({ userId }: { userId: number }) {
    const onboardingOpen = useStudentOnboardingOpen();
    const [open, setOpen] = useState(false);
    const [handingOff, setHandingOff] = useState(false);
    const startAfterClose = useRef(false);
    const { active: tourActive, startTour } = useStudentMenuTour();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const storageKey = featureGuideKey(userId, studentJourneySummaryId);
    const seen = useSyncExternalStore(
        subscribeToFeatureGuides,
        () =>
            hasSeenFeatureGuide(storageKey) &&
            hasSeenFeatureGuide(featureGuideKey(userId, studentMenuTourId)),
        () => false,
    );

    useEffect(() => {
        if (onboardingOpen || seen || open || handingOff || tourActive) {
            return;
        }

        let timer: number;
        const scheduleIntroduction = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                const editing = document.activeElement?.matches(
                    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="combobox"]',
                );
                const anotherOverlay = document.querySelector(
                    '[role="dialog"], [role="alertdialog"], [role="menu"]',
                );

                if (!editing && !anotherOverlay && document.hasFocus()) {
                    setOpen(true);
                }
            }, 220);
        };
        const observer = new MutationObserver(scheduleIntroduction);
        observer.observe(document.body, { childList: true, subtree: true });
        document.addEventListener('focusin', scheduleIntroduction);
        window.addEventListener('focus', scheduleIntroduction);
        scheduleIntroduction();

        return () => {
            window.clearTimeout(timer);
            observer.disconnect();
            document.removeEventListener('focusin', scheduleIntroduction);
            window.removeEventListener('focus', scheduleIntroduction);
        };
    }, [onboardingOpen, seen, open, handingOff, tourActive]);

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen && open) {
            markFeatureGuideSeen(storageKey);

            if (!startAfterClose.current) {
                markFeatureGuideSeen(
                    featureGuideKey(userId, studentMenuTourId),
                );
            }
        }

        if (nextOpen) {
            setHandingOff(false);
        }

        setOpen(nextOpen);
    }

    return (
        <Dialog open={open && !onboardingOpen} onOpenChange={handleOpenChange}>
            <section
                aria-labelledby="student-journey-heading"
                className="min-w-0 border-t border-border px-1 pt-7 pb-2 sm:pt-8"
                data-test="student-journey-summary"
            >
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">
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

                <ol className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
                    {journeySteps.map((step, index) => {
                        const Icon = step.icon;

                        return (
                            <li
                                key={step.title}
                                className="min-w-0 border-t border-border/80 pt-4"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-xs">
                                        <Icon
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </span>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        <span className="text-muted-foreground">
                                            {index + 1}.{' '}
                                        </span>
                                        {step.title}
                                    </h3>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                    {step.summary}
                                </p>
                            </li>
                        );
                    })}
                </ol>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    Tugas yang selesai belum otomatis menjadi kontribusi
                    terverifikasi. Ajukan kontribusimu untuk ditinjau kampus.
                </p>
            </section>

            <DialogContent
                className="flex max-h-[90svh] flex-col gap-0 overflow-hidden rounded-3xl bg-card p-0 motion-reduce:animate-none sm:max-w-xl"
                data-test="student-journey-guide"
                onCloseAutoFocus={(event) => {
                    if (startAfterClose.current) {
                        event.preventDefault();
                        startAfterClose.current = false;
                        window.requestAnimationFrame(startTour);

                        return;
                    }

                    if (onboardingOpen || !triggerRef.current?.isConnected) {
                        event.preventDefault();
                    }
                }}
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
                            Portofolio publik dan izin ditemukan perekrut
                            merupakan pilihan terpisah. Kamu mengendalikan
                            visibilitas melalui pengaturan profil dan
                            portofolio.
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
                            onClick={() => {
                                startAfterClose.current = true;
                                setHandingOff(true);
                            }}
                        >
                            Mulai tur
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
