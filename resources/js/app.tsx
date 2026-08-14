import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import StudentLayout from '@/layouts/student-layout';

const appName = import.meta.env.VITE_APP_NAME || 'SATU';

function isStudentPage(name: string): boolean {
    return [
        'dashboard',
        'onboarding',
        'projects/',
        'contributions/',
        'portfolio/',
        'leaderboards/',
        'student/',
    ].some((studentPage) =>
        studentPage.endsWith('/')
            ? name.startsWith(studentPage)
            : name === studentPage,
    );
}

if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'portfolio/public':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [StudentLayout, SettingsLayout];
            case isStudentPage(name):
                return StudentLayout;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#1746B0',
    },
});
