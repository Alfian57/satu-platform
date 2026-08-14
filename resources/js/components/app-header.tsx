import { usePage } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NavUser } from '@/components/nav-user';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getWorkspaceContext } from '@/lib/workspace-context';
import type { BreadcrumbItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

export function AppHeader({ breadcrumbs = [] }: Props) {
    const { auth } = usePage().props;
    const workspace = getWorkspaceContext(
        auth.user?.workspace.role ?? 'student',
    );
    const currentPageTitle = breadcrumbs.at(-1)?.title ?? workspace.mobileTitle;

    return (
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-sidebar-border bg-background px-3 md:px-5 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger
                    className="size-control-lg min-h-control-lg min-w-control-lg shrink-0 rounded-sm md:size-control-md md:min-h-control-md md:min-w-control-md"
                    data-test="sidebar-trigger"
                />

                <div className="min-w-0 md:hidden">
                    <p className="text-xs leading-none font-semibold text-primary">
                        SATU
                    </p>
                    <p
                        className="mt-1 truncate text-sm leading-none font-medium"
                        data-test="app-workspace-title"
                    >
                        {currentPageTitle}
                    </p>
                </div>

                <div className="hidden min-w-0 md:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 md:gap-2">
                <NavUser />
            </div>
        </header>
    );
}
