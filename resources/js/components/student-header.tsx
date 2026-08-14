import { Breadcrumbs } from '@/components/breadcrumbs';
import { NavUser } from '@/components/nav-user';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

export function StudentHeader({ breadcrumbs = [] }: Props) {
    const currentPageTitle = breadcrumbs.at(-1)?.title ?? 'Dashboard';

    return (
        <header className="sticky top-0 z-20 flex min-h-[4.75rem] shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger
                    className="size-11 shrink-0 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 md:size-10"
                    data-test="sidebar-trigger"
                />

                <div className="min-w-0 md:hidden">
                    <p className="text-xs font-bold tracking-[0.16em] text-blue-700 uppercase">
                        SATU
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-950">
                        {currentPageTitle}
                    </p>
                </div>

                <div className="hidden min-w-0 md:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <NavUser />
            </div>
        </header>
    );
}
