import { Link, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    BriefcaseBusiness,
    Building2,
    FileCheck2,
    LayoutDashboard,
    ListOrdered,
    ShieldCheck,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as contributionsIndex } from '@/routes/contributions';
import { index as leaderboardsIndex } from '@/routes/leaderboards';
import { show as onboarding } from '@/routes/onboarding';
import { index as portfolioIndex } from '@/routes/portfolio';
import { index as projectsIndex } from '@/routes/projects';
import type {
    InstitutionMembershipStatus,
    NavItem,
    ShellContext,
} from '@/types';

const studentNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Project',
        href: projectsIndex(),
        icon: BriefcaseBusiness,
    },
    {
        title: 'Contribution',
        href: contributionsIndex(),
        icon: FileCheck2,
    },
    {
        title: 'Portofolio',
        href: portfolioIndex(),
        icon: BookOpenCheck,
    },
    {
        title: 'Leaderboard',
        href: leaderboardsIndex(),
        icon: ListOrdered,
    },
];

const membershipStatusMeta: Record<
    InstitutionMembershipStatus,
    { label: string; className: string }
> = {
    unverified: {
        label: 'Belum terverifikasi',
        className: 'border-slate-200 bg-slate-50 text-slate-600',
    },
    pending: {
        label: 'Menunggu tinjauan',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    verified: {
        label: 'Terverifikasi',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    suspended: {
        label: 'Akses ditangguhkan',
        className: 'border-rose-200 bg-rose-50 text-rose-800',
    },
};

function StudentNav() {
    const { shell } = usePage().props;
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { isMobile, setOpenMobile } = useSidebar();
    const visibleItems =
        shell.institutionMembership?.status === 'verified'
            ? studentNavItems
            : studentNavItems.filter((item) => item.title === 'Dashboard');

    return (
        <nav aria-label="Navigasi mahasiswa" className="px-3">
            <p className="px-3 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                Ruang kerja
            </p>
            <ul className="mt-3 grid gap-1.5">
                {visibleItems.map((item) => {
                    const isActive = isCurrentOrParentUrl(item.href);
                    const Icon = item.icon;

                    return (
                        <li key={item.title}>
                            <Link
                                aria-current={isActive ? 'page' : undefined}
                                href={item.href}
                                prefetch
                                onClick={() => {
                                    if (isMobile) {
                                        setOpenMobile(false);
                                    }
                                }}
                                className={cn(
                                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold',
                                    isActive
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-950/25'
                                        : 'text-slate-600',
                                )}
                            >
                                {Icon && (
                                    <span
                                        className={cn(
                                            'flex size-7 shrink-0 items-center justify-center rounded-lg',
                                            isActive
                                                ? 'bg-white/15'
                                                : 'bg-slate-100 text-slate-500',
                                        )}
                                    >
                                        <Icon
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </span>
                                )}
                                <span className="truncate">{item.title}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

function InstitutionContext({ shell }: { shell: ShellContext }) {
    const membership = shell.institutionMembership;

    if (!membership) {
        return (
            <Link
                href={onboarding()}
                className="group flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Building2 aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0">
                    <span className="block text-xs font-medium text-slate-500">
                        Afiliasi kampus
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-slate-950 group-hover:text-blue-700">
                        Hubungkan kampus
                    </span>
                </span>
            </Link>
        );
    }

    const status = membershipStatusMeta[membership.status];
    const content = (
        <>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <ShieldCheck aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0">
                <span className="block text-xs font-medium text-slate-500">
                    Afiliasi kampus
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-slate-950">
                    {membership.institutionName}
                </span>
                <span
                    className={cn(
                        'mt-2 inline-flex rounded-md border px-2 py-1 text-xs font-semibold',
                        status.className,
                    )}
                >
                    {status.label}
                </span>
            </span>
        </>
    );

    return membership.status === 'verified' ? (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
            {content}
        </div>
    ) : (
        <Link
            href={onboarding()}
            className="flex min-h-11 items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50"
        >
            {content}
        </Link>
    );
}

export function StudentSidebar() {
    const { shell } = usePage().props;

    return (
        <Sidebar
            collapsible="offcanvas"
            variant="sidebar"
            className="border-r border-slate-200 bg-white text-slate-950"
        >
            <SidebarHeader className="border-b border-slate-200 px-6 py-7">
                <Link
                    aria-label="SATU: Dashboard"
                    href={dashboard()}
                    prefetch
                    className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                >
                    <AppLogo
                        className="text-slate-950"
                        logoClassName="size-12 rounded-xl"
                        ruleClassName="bg-blue-600"
                    />
                </Link>
            </SidebarHeader>

            <SidebarContent className="py-7">
                <StudentNav />
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 p-4">
                <InstitutionContext shell={shell} />
            </SidebarFooter>
        </Sidebar>
    );
}
