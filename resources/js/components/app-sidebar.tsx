import { Link, usePage } from '@inertiajs/react';
import { BriefcaseBusiness, Building2, LayoutDashboard } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { show as onboarding } from '@/routes/onboarding';
import { index as projectsIndex } from '@/routes/projects';
import type {
    InstitutionMembershipStatus,
    NavItem,
    ShellContext,
} from '@/types';

const mainNavItems: NavItem[] = [
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
];

const membershipStatuses: Record<
    InstitutionMembershipStatus,
    { label: string; className: string }
> = {
    unverified: {
        label: 'Belum terverifikasi',
        className: 'bg-muted text-muted-foreground border-sidebar-border',
    },
    pending: {
        label: 'Menunggu tinjauan',
        className:
            'bg-pending-subtle text-pending-subtle-foreground border-pending/30',
    },
    verified: {
        label: 'Terverifikasi',
        className:
            'bg-verified-subtle text-verified-subtle-foreground border-verified/30',
    },
    suspended: {
        label: 'Akses ditangguhkan',
        className:
            'bg-correction-subtle text-correction-subtle-foreground border-correction/30',
    },
};

function InstitutionMembershipContext({ shell }: { shell: ShellContext }) {
    const membership = shell.institutionMembership;
    const membershipContent = membership ? (
        <>
            <p className="truncate text-sm font-semibold">
                {membership.institutionName}
            </p>
            <span
                className={cn(
                    'w-fit border px-2 py-1 text-xs font-medium',
                    membershipStatuses[membership.status].className,
                )}
            >
                {membershipStatuses[membership.status].label}
            </span>
        </>
    ) : (
        <>
            <Building2 aria-hidden="true" className="size-4 shrink-0" />
            <span className="text-sm font-semibold">Hubungkan kampus</span>
        </>
    );

    return (
        <div aria-label="Afiliasi kampus" className="px-6 py-5">
            <p className="font-label text-label leading-none text-sidebar-foreground/65">
                Afiliasi kampus
            </p>
            {membership?.status === 'verified' ? (
                <div className="mt-3 grid gap-2">{membershipContent}</div>
            ) : (
                <Link
                    href={onboarding()}
                    aria-label={
                        membership
                            ? `Buka status afiliasi ${membership.institutionName}`
                            : 'Hubungkan akun dengan kampus'
                    }
                    className={cn(
                        'mt-3 min-h-control-md cursor-pointer',
                        membership
                            ? 'grid gap-2 hover:underline'
                            : 'flex items-center gap-3 text-primary hover:underline',
                    )}
                >
                    {membershipContent}
                </Link>
            )}
        </div>
    );
}

export function AppSidebar() {
    const { shell } = usePage().props;
    const visibleMainNavItems =
        shell.institutionMembership?.status === 'verified'
            ? mainNavItems
            : mainNavItems.filter((item) => item.title !== 'Project');

    return (
        <Sidebar collapsible="offcanvas" variant="sidebar">
            <SidebarHeader className="border-b border-sidebar-border px-6 py-7">
                <Link aria-label="SATU: Dashboard" href={dashboard()} prefetch>
                    <AppLogo
                        className="text-sidebar-foreground"
                        ruleClassName="bg-sidebar-primary"
                    />
                </Link>
            </SidebarHeader>

            <SidebarContent className="py-6">
                <NavMain items={visibleMainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border p-0">
                <InstitutionMembershipContext shell={shell} />
            </SidebarFooter>
        </Sidebar>
    );
}
