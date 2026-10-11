import { Link, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    BookmarkCheck,
    BriefcaseBusiness,
    Building2,
    ClipboardCheck,
    FileCheck2,
    FileSpreadsheet,
    GraduationCap,
    LayoutDashboard,
    ListOrdered,
    Network,
    Search,
    RefreshCw,
    SendHorizontal,
    ShieldCheck,
    Sparkles,
    X,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import { NavMain } from '@/components/nav-main';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from '@/components/ui/sidebar';
import { WorkspaceContextCard } from '@/components/workspace-context-card';
import { getWorkspaceContext } from '@/lib/workspace-context';
import { dashboard } from '@/routes';
import { index as affiliationIndex } from '@/routes/campus/affiliations';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';
import { index as campusCreditMappingsIndex } from '@/routes/campus/credit-mappings';
import { index as campusInclusionIndex } from '@/routes/campus/inclusion';
import { index as campusIntegrationsIndex } from '@/routes/campus/integrations';
import { show as campusOverview } from '@/routes/campus/overview';
import { show as campusRoster } from '@/routes/campus/roster';
import { index as contributionsIndex } from '@/routes/contributions';
import { index as leaderboardsIndex } from '@/routes/leaderboards';
import { index as platformAffiliationsIndex } from '@/routes/platform/affiliations';
import { index as platformOperationsIndex } from '@/routes/platform/operations';
import { index as platformSkillsIndex } from '@/routes/platform/skills';
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
];

const membershipStatuses: Record<
    InstitutionMembershipStatus,
    {
        label: string;
        variant: 'secondary' | 'verified' | 'pending' | 'correction';
    }
> = {
    unverified: { label: 'Belum terverifikasi', variant: 'secondary' },
    pending: { label: 'Menunggu tinjauan', variant: 'pending' },
    verified: { label: 'Terverifikasi', variant: 'verified' },
    suspended: { label: 'Akses ditangguhkan', variant: 'correction' },
};

function InstitutionMembershipContext({ shell }: { shell: ShellContext }) {
    const membership = shell.institutionMembership;
    const status = membership ? membershipStatuses[membership.status] : null;
    const content = (
        <WorkspaceContextCard
            label="Afiliasi kampus"
            name={membership?.institutionName ?? 'Hubungkan kampus'}
            icon={Building2}
        >
            {status && (
                <Badge
                    variant={status.variant}
                    className="max-w-full whitespace-normal"
                >
                    {status.label}
                </Badge>
            )}
        </WorkspaceContextCard>
    );

    return membership?.status === 'verified' ? (
        content
    ) : (
        <Link
            href={dashboard()}
            className="group block cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label={
                membership
                    ? `Buka status afiliasi ${membership.institutionName}`
                    : 'Hubungkan akun dengan kampus'
            }
        >
            {content}
        </Link>
    );
}

function CampusWorkspaceContext({
    institutionName,
}: {
    institutionName: string;
}) {
    return (
        <WorkspaceContextCard
            label="Operasi kampus"
            name={institutionName}
            icon={Building2}
        />
    );
}

function PlatformWorkspaceContext() {
    return (
        <WorkspaceContextCard
            label="Operasi platform"
            name="Lintas institusi SATU"
            icon={ShieldCheck}
        />
    );
}

function RecruiterWorkspaceContext({
    organizationName,
}: {
    organizationName: string;
}) {
    return (
        <WorkspaceContextCard
            label="Ruang perekrut"
            name={organizationName}
            icon={BriefcaseBusiness}
        />
    );
}

export function AppSidebar() {
    const { auth, shell } = usePage().props;
    const workspace = auth.user?.workspace;
    const role = workspace?.role ?? 'student';
    const roleContext = getWorkspaceContext(role);
    const RoleIcon = roleContext.icon;
    const { isMobile, setOpenMobile } = useSidebar();
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
                  title: 'Operasi platform',
                  href: platformOperationsIndex(),
                  icon: ShieldCheck,
              },
              {
                  title: 'Afiliasi kampus',
                  href: platformAffiliationsIndex(),
                  icon: Building2,
              },
              {
                  title: 'Taksonomi skill',
                  href: platformSkillsIndex(),
                  icon: Sparkles,
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
                        !['Proyek', 'Kontribusi', 'Portofolio'].includes(
                            item.title,
                        ),
                );
    const advancedNavItems: NavItem[] = isCampusWorkspace
        ? [
              {
                  title: 'Peninjauan inklusi',
                  href: campusInclusionIndex({
                      institution: campusInstitution.id,
                  }),
                  icon: Network,
              },
              {
                  title: 'Pemetaan kredit',
                  href: campusCreditMappingsIndex({
                      institution: campusInstitution.id,
                  }),
                  icon: GraduationCap,
              },
              {
                  title: 'Sinkronisasi akademik',
                  href: campusIntegrationsIndex({
                      institution: campusInstitution.id,
                  }),
                  icon: RefreshCw,
              },
          ]
        : role === 'student' &&
            shell.institutionMembership?.status === 'verified'
          ? [
                {
                    title: 'Peringkat',
                    href: leaderboardsIndex(),
                    icon: ListOrdered,
                },
            ]
          : [];

    return (
        <Sidebar
            collapsible="offcanvas"
            variant="sidebar"
            className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
        >
            <SidebarHeader className="relative isolate shrink-0 gap-4 border-b border-primary/10 bg-linear-to-br from-accent/80 via-card to-card px-4 pt-5 pb-4">
                <ArchiveArt className="absolute -top-1 right-2 w-20 rotate-12 opacity-35" />
                <div className="relative flex items-start gap-2">
                    <Link
                        aria-label={
                            isPlatformAdmin
                                ? 'SATU: Operasi platform'
                                : isCampusWorkspace
                                  ? 'SATU: Operasi kampus'
                                  : isRecruiterWorkspace
                                    ? 'SATU: Ruang perekrut'
                                    : 'SATU: Beranda'
                        }
                        href={
                            isPlatformAdmin
                                ? platformOperationsIndex()
                                : isCampusWorkspace
                                  ? campusOverview({
                                        institution: campusInstitution.id,
                                    })
                                  : isRecruiterWorkspace
                                    ? talentSearch()
                                    : dashboard()
                        }
                        prefetch
                        className="flex min-h-14 min-w-0 flex-1 cursor-pointer items-center rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                        data-test="sidebar-brand"
                    >
                        <AppLogo
                            className="text-foreground"
                            variant="sidebar"
                        />
                    </Link>
                    {isMobile && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-11 shrink-0 rounded-xl border border-white/80 bg-card/70 text-muted-foreground"
                            aria-label="Tutup navigasi"
                            data-test="sidebar-close"
                            onClick={() => setOpenMobile(false)}
                        >
                            <X aria-hidden="true" className="size-4" />
                        </Button>
                    )}
                </div>
                <p
                    className="relative flex w-fit max-w-full items-center gap-2 rounded-full border border-primary/10 bg-card/85 px-3 py-1.5 text-xs font-semibold text-primary shadow-xs"
                    data-test="sidebar-role"
                >
                    <RoleIcon aria-hidden="true" className="size-3.5" />
                    {roleContext.accountLabel}
                </p>
            </SidebarHeader>

            <SidebarContent className="gap-6 pt-5">
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
                    description={
                        isRecruiterWorkspace
                            ? 'Modul lanjutan. Akses tetap mengikuti izin mahasiswa dan hak organisasi.'
                            : role === 'student' &&
                                shell.institutionMembership?.status !==
                                    'verified'
                              ? shell.institutionMembership?.status ===
                                'suspended'
                                  ? 'Menu kolaborasi tidak tersedia selama akses kampus ditangguhkan.'
                                  : 'Menu kolaborasi tersedia setelah afiliasi kampus terverifikasi.'
                              : undefined
                    }
                />
                {advancedNavItems.length > 0 && (
                    <NavMain
                        key={`${auth.user?.id}-${role}-${campusInstitution?.id ?? 'student'}`}
                        items={advancedNavItems}
                        label="Fitur lanjutan"
                        ariaLabel="Navigasi fitur lanjutan"
                        description="Bukan bagian alur utama. Akses dan pengaturan izin tetap berlaku."
                        collapsible
                    />
                )}
                <SidebarFooter className="mt-auto shrink-0 border-t border-primary/10 bg-linear-to-b from-card to-accent/35 p-3">
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
            </SidebarContent>
        </Sidebar>
    );
}
