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
            className={cn('overflow-x-hidden', className)}
            {...props}
        />
    );
}
