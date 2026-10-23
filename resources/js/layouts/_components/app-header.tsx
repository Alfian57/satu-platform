import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/layouts/_components/breadcrumbs';
import { NavUser } from '@/layouts/_components/nav-user';
import { getWorkspaceContext } from '@/lib/workspace-context';
import type { BreadcrumbItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
    children?: ReactNode;
};

export function AppHeader({ breadcrumbs = [], children }: Props) {
    const { auth } = usePage().props;
    const workspace = getWorkspaceContext(
        auth.user?.workspace.role ?? 'student',
    );
    const currentPageTitle = breadcrumbs.at(-1)?.title ?? workspace.mobileTitle;

    return (
        <header
            data-test="app-header"
            className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-background/95 px-3 backdrop-blur-xl sm:gap-4 sm:px-6 lg:px-8"
        >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <SidebarTrigger
                    className="size-11 shrink-0 cursor-pointer rounded-lg border border-border bg-card text-primary shadow-xs hover:bg-accent"
                    data-test="sidebar-trigger"
                />

                <div className="min-w-0 flex-1">
                    <p
                        className="truncate text-xs leading-4 font-medium text-muted-foreground"
                        title={workspace.mobileTitle}
                    >
                        {workspace.mobileTitle}
                    </p>
                    <p
                        className="mt-0.5 truncate text-sm leading-5 font-semibold md:hidden"
                        data-test="app-workspace-title"
                        title={currentPageTitle}
                    >
                        {currentPageTitle}
                    </p>
                    <div className="hidden min-w-0 md:block">
                        {breadcrumbs.length > 0 ? (
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        ) : (
                            <p className="text-sm font-semibold">
                                {workspace.accountLabel}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 md:gap-2">
                {children}
                <NavUser />
            </div>
        </header>
    );
}
