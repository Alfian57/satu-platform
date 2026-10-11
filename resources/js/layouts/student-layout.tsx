import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { StudentHeader } from '@/components/student-header';
import { StudentMenuTourProvider } from '@/components/student-menu-tour';
import { StudentOnboardingProvider } from '@/components/student-onboarding-context';
import { StudentSidebar } from '@/components/student-sidebar';
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
