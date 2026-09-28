import { Breadcrumbs } from '@/components/breadcrumbs';
import { NavUser } from '@/components/nav-user';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

export function StudentHeader({ breadcrumbs = [] }: Props) {
    const currentPageTitle = breadcrumbs.at(-1)?.title ?? 'Beranda';

    return (
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/80 bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger
                    className="size-11 shrink-0 cursor-pointer rounded-full border border-white bg-white/80 text-primary shadow-xs transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none md:size-10"
                    data-test="sidebar-trigger"
                />

                <div className="min-w-0 md:hidden">
                    <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                        SATU
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
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
