import * as React from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function AppContent({
    className,
    ...props
}: React.ComponentProps<typeof SidebarInset>) {
    return (
        <SidebarInset
            id="main-content"
            tabIndex={-1}
            className={cn(
                'min-w-0 overflow-x-clip focus:outline-none',
                className,
            )}
            {...props}
        />
    );
}
