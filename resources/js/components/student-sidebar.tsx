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
import { index as portfolioIndex } from '@/routes/portfolio';
import { index as projectsIndex } from '@/routes/projects';
import type {
    InstitutionMembershipStatus,
    NavItem,
    ShellContext,
} from '@/types';

const studentNavItems: NavItem[] = [
    {
        title: 'Beranda',
        href: dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Proyek',
        href: projectsIndex(),
        icon: BriefcaseBusiness,
    },
    {
        title: 'Kontribusi',
        href: contributionsIndex(),
        icon: FileCheck2,
    },
    {
        title: 'Portofolio',
        href: portfolioIndex(),
        icon: BookOpenCheck,
    },
    {
        title: 'Peringkat',
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
        className: 'border-border bg-muted text-muted-foreground',
    },
    pending: {
        label: 'Menunggu tinjauan',
        className:
            'border-pending/30 bg-pending-subtle text-pending-subtle-foreground',
    },
    verified: {
        label: 'Terverifikasi',
        className:
            'border-verified/30 bg-verified-subtle text-verified-subtle-foreground',
    },
    suspended: {
        label: 'Akses ditangguhkan',
        className:
            'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
    },
};

function StudentNav() {
    const { shell } = usePage().props;
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { isMobile, setOpenMobile } = useSidebar();
    const visibleItems =
        shell.institutionMembership?.status === 'verified'
            ? studentNavItems
            : studentNavItems.filter((item) => item.title === 'Beranda');

    return (
        <nav aria-label="Navigasi mahasiswa" className="px-3">
            <p className="px-3 text-xs font-semibold text-muted-foreground">
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
                                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none',
                                    isActive
                                        ? 'bg-sidebar-accent text-primary shadow-xs'
                                        : 'text-muted-foreground hover:bg-white hover:text-primary',
                                )}
                            >
                                {Icon && (
                                    <span
                                        className={cn(
                                            'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                                            isActive
                                                ? 'bg-white text-primary'
                                                : 'bg-white/70 text-muted-foreground',
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
                href={dashboard()}
                aria-label="Hubungkan akun dengan kampus"
                className="group flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-white bg-white/75 px-3 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
            >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <Building2 aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0">
                    <span className="block text-xs font-medium text-muted-foreground">
                        Afiliasi kampus
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-foreground group-hover:text-primary">
                        Hubungkan kampus
                    </span>
                </span>
            </Link>
        );
    }

    const status = membershipStatusMeta[membership.status];
    const content = (
        <>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <ShieldCheck aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0">
                <span className="block text-xs font-medium text-muted-foreground">
                    Afiliasi kampus
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">
                    {membership.institutionName}
                </span>
                <span
                    className={cn(
                        'mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold',
                        status.className,
                    )}
                >
                    {status.label}
                </span>
            </span>
        </>
    );

    return membership.status === 'verified' ? (
        <div className="flex items-start gap-3 rounded-2xl border border-white bg-white/75 px-3 py-3">
            {content}
        </div>
    ) : (
        <Link
            href={dashboard()}
            aria-label={`Buka status afiliasi ${membership.institutionName}`}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-white bg-white/75 px-3 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
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
            className="border-r border-sidebar-border/70 bg-sidebar text-sidebar-foreground"
        >
            <SidebarHeader className="h-20 shrink-0 flex-row items-center p-0 px-5">
                <Link
                    aria-label="SATU: Beranda"
                    href={dashboard()}
                    prefetch
                    className="flex w-full items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                    <AppLogo
                        className="text-slate-950"
                        logoClassName="size-10 rounded-2xl"
                        ruleClassName="bg-blue-600"
                    />
                </Link>
            </SidebarHeader>

            <SidebarContent className="gap-8 py-4">
                <StudentNav />
            </SidebarContent>

            <SidebarFooter className="p-4">
                <InstitutionContext shell={shell} />
            </SidebarFooter>
        </Sidebar>
    );
}
