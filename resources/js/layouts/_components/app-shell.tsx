import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';

type Props = {
    children: ReactNode;
};

export function AppShell({ children }: Props) {
    const isOpen = usePage().props.sidebarOpen;

    return (
        <SidebarProvider defaultOpen={isOpen}>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-xl focus:border focus:border-border focus:bg-card focus:px-4 focus:py-3 focus:text-primary focus:shadow-md focus:outline-2 focus:outline-offset-2 focus:outline-ring"
            >
                Lewati ke konten utama
            </a>
            {children}
        </SidebarProvider>
    );
}
