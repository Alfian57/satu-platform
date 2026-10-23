import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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

export function useStudentJourneyGuide(
    userId: number,
    onboardingOpen: boolean,
    tourActive: boolean,
    startTour: () => void,
) {
    const [open, setOpen] = useState(false);
    const [handingOff, setHandingOff] = useState(false);
    const startAfterClose = useRef(false);
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

    function handleStartTour() {
        startAfterClose.current = true;
        setHandingOff(true);
    }

    function handleCloseAutoFocus(event: Event) {
        if (startAfterClose.current) {
            event.preventDefault();
            startAfterClose.current = false;
            window.requestAnimationFrame(startTour);

            return;
        }

        if (onboardingOpen || !triggerRef.current?.isConnected) {
            event.preventDefault();
        }
    }

    return {
        open,
        triggerRef,
        handleOpenChange,
        handleStartTour,
        handleCloseAutoFocus,
    };
}
