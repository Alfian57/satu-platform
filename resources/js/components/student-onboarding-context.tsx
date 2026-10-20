import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { OnboardingModal } from '@/components/onboarding-modal';

const StudentOnboardingContext = createContext(true);
const StudentOnboardingLauncher = createContext<() => void>(() => undefined);

export function StudentOnboardingProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const [openRequest, setOpenRequest] = useState(0);
    const open = useCallback(() => setOpenRequest((value) => value + 1), []);

    return (
        <StudentOnboardingContext value={isOpen}>
            <StudentOnboardingLauncher value={open}>
                {children}
                <OnboardingModal
                    onVisibilityChange={setIsOpen}
                    openRequest={openRequest}
                />
            </StudentOnboardingLauncher>
        </StudentOnboardingContext>
    );
}

export function useStudentOnboardingLauncher(): () => void {
    return useContext(StudentOnboardingLauncher);
}

export function useStudentOnboardingOpen(): boolean {
    return useContext(StudentOnboardingContext);
}
