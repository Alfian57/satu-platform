import { usePage } from '@inertiajs/react';
import { StudentOnboardingProvider } from '@/components/onboarding/student-onboarding-context';
import { StudentMenuTourProvider } from '@/components/student-tour';
import { AppContent } from '@/layouts/_components/app-content';
import { AppShell } from '@/layouts/_components/app-shell';
import { StudentHeader } from '@/layouts/_components/student-header';
import { StudentSidebar } from '@/layouts/_components/student-sidebar';
import AppLayout from '@/layouts/app-layout';
import type { AppLayoutProps } from '@/types';

export default function StudentLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage().props;

    if (auth.user?.workspace.role !== 'student') {
        return <AppLayout breadcrumbs={breadcrumbs}>{children}</AppLayout>;
    }

    return (
        <StudentOnboardingProvider key={auth.user.id}>
            <AppShell>
                <StudentMenuTourProvider userId={auth.user.id}>
                    <StudentSidebar />
                    <AppContent className="bg-background">
                        <StudentHeader breadcrumbs={breadcrumbs} />
                        {children}
                    </AppContent>
                </StudentMenuTourProvider>
            </AppShell>
        </StudentOnboardingProvider>
    );
}
