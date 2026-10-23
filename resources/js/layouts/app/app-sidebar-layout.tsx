import { AppContent } from '@/layouts/_components/app-content';
import { AppHeader } from '@/layouts/_components/app-header';
import { AppShell } from '@/layouts/_components/app-shell';
import { AppSidebar } from '@/layouts/_components/app-sidebar';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell>
            <AppSidebar />
            <AppContent>
                <AppHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
