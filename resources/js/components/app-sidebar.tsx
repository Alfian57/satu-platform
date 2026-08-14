import { Link, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    BookmarkCheck,
    BriefcaseBusiness,
    Building2,
    ClipboardCheck,
    FileCheck2,
    FileSpreadsheet,
    LayoutDashboard,
    ListOrdered,
    Network,
    Search,
    SendHorizontal,
    ShieldCheck,
} from 'lucide-react';
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
import { index as affiliationIndex } from '@/routes/campus/affiliations';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';
import { index as campusInclusionIndex } from '@/routes/campus/inclusion';
import { show as campusOverview } from '@/routes/campus/overview';
import { show as campusRoster } from '@/routes/campus/roster';
import { index as contributionsIndex } from '@/routes/contributions';
import { index as leaderboardsIndex } from '@/routes/leaderboards';
import { show as onboarding } from '@/routes/onboarding';
import { index as platformAffiliationsIndex } from '@/routes/platform/affiliations';
import { index as portfolioIndex } from '@/routes/portfolio';
import { index as projectsIndex } from '@/routes/projects';
import {
    saved as savedCandidates,
    search as talentSearch,
} from '@/routes/recruiter/talent';
import { index as contactRequestsIndex } from '@/routes/recruiter/talent/contact-requests';
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

function CampusWorkspaceContext({
    institutionName,
}: {
    institutionName: string;
}) {
    return (
        <div
            aria-label="Konteks operasi kampus"
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
        >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Building2 aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0">
                <span className="block text-xs font-medium text-slate-500">
                    Operasi kampus
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-slate-950">
                    {institutionName}
                </span>
            </span>
        </div>
    );
}

function PlatformWorkspaceContext() {
    return (
        <div
            aria-label="Konteks operasi platform"
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
        >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <ShieldCheck aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0">
                <span className="block text-xs font-medium text-slate-500">
                    Operasi platform
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-slate-950">
                    Lintas institusi SATU
                </span>
            </span>
        </div>
    );
}

function RecruiterWorkspaceContext({
    organizationName,
}: {
    organizationName: string;
}) {
    return (
        <div
            aria-label="Konteks ruang perekrut"
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
        >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <BriefcaseBusiness aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0">
                <span className="block text-xs font-medium text-slate-500">
                    Ruang perekrut
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-slate-950">
                    {organizationName}
                </span>
            </span>
        </div>
    );
}

export function AppSidebar() {
    const { auth, shell } = usePage().props;
    const workspace = auth.user?.workspace;
    const role = workspace?.role ?? 'student';
    const campusInstitution = workspace?.institution;
    const recruiterOrganization = workspace?.recruiterOrganization;
    const isPlatformAdmin = role === 'platform_admin';
    const isCampusWorkspace =
        role === 'campus_admin' &&
        campusInstitution !== null &&
        campusInstitution !== undefined;
    const isRecruiterWorkspace =
        role === 'recruiter' &&
        recruiterOrganization !== null &&
        recruiterOrganization !== undefined;
    const visibleMainNavItems = isPlatformAdmin
        ? [
              {
                  title: 'Afiliasi kampus',
                  href: platformAffiliationsIndex(),
                  icon: Building2,
              },
          ]
        : isCampusWorkspace
          ? [
                {
                    title: 'Ringkasan',
                    href: campusOverview({
                        institution: campusInstitution.id,
                    }),
                    icon: LayoutDashboard,
                },
                {
                    title: 'Afiliasi kampus',
                    href: affiliationIndex({
                        institution: campusInstitution.id,
                    }),
                    icon: ClipboardCheck,
                },
                {
                    title: 'Roster mahasiswa',
                    href: campusRoster({
                        institution: campusInstitution.id,
                    }),
                    icon: FileSpreadsheet,
                },
                {
                    title: 'Validasi kontribusi',
                    href: campusContributionsIndex({
                        institution: campusInstitution.id,
                    }),
                    icon: FileCheck2,
                },
                {
                    title: 'Peninjauan inklusi',
                    href: campusInclusionIndex({
                        institution: campusInstitution.id,
                    }),
                    icon: Network,
                },
            ]
          : isRecruiterWorkspace
            ? [
                  {
                      title: 'Cari talenta',
                      href: talentSearch(),
                      icon: Search,
                  },
                  {
                      title: 'Kandidat tersimpan',
                      href: savedCandidates(),
                      icon: BookmarkCheck,
                  },
                  {
                      title: 'Permintaan kontak',
                      href: contactRequestsIndex(),
                      icon: SendHorizontal,
                  },
              ]
            : shell.institutionMembership?.status === 'verified'
              ? mainNavItems
              : mainNavItems.filter(
                    (item) =>
                        ![
                            'Project',
                            'Contribution',
                            'Portofolio',
                            'Leaderboard',
                        ].includes(item.title),
                );

    return (
        <Sidebar
            collapsible="offcanvas"
            variant="sidebar"
            className="border-r border-slate-200 bg-white text-slate-950"
        >
            <SidebarHeader className="border-b border-slate-200 px-6 py-7">
                <Link
                    aria-label={
                        isPlatformAdmin
                            ? 'SATU: Operasi platform'
                            : isCampusWorkspace
                              ? 'SATU: Operasi kampus'
                              : isRecruiterWorkspace
                                ? 'SATU: Ruang perekrut'
                                : 'SATU: Dashboard'
                    }
                    href={
                        isPlatformAdmin
                            ? platformAffiliationsIndex()
                            : isCampusWorkspace
                              ? campusOverview({
                                    institution: campusInstitution.id,
                                })
                              : isRecruiterWorkspace
                                ? talentSearch()
                                : dashboard()
                    }
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
                <NavMain
                    items={visibleMainNavItems}
                    ariaLabel={
                        isPlatformAdmin
                            ? 'Navigasi admin platform'
                            : isCampusWorkspace
                              ? 'Navigasi operator kampus'
                              : isRecruiterWorkspace
                                ? 'Navigasi perekrut'
                                : 'Navigasi utama'
                    }
                    label={
                        isPlatformAdmin
                            ? 'Operasi platform'
                            : isCampusWorkspace
                              ? 'Operasi kampus'
                              : isRecruiterWorkspace
                                ? 'Ruang perekrut'
                                : 'Ruang kerja'
                    }
                />
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 p-4">
                {isPlatformAdmin ? (
                    <PlatformWorkspaceContext />
                ) : isCampusWorkspace ? (
                    <CampusWorkspaceContext
                        institutionName={campusInstitution.name}
                    />
                ) : isRecruiterWorkspace ? (
                    <RecruiterWorkspaceContext
                        organizationName={recruiterOrganization.name}
                    />
                ) : (
                    <InstitutionMembershipContext shell={shell} />
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
