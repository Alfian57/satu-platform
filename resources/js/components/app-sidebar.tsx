import { Link, usePage } from '@inertiajs/react';
import {
    Blocks,
    Building2,
    ChartBar,
    ClipboardCheck,
    ContactRound,
    FolderKanban,
    GalleryVerticalEnd,
    HandHeart,
    House,
    LayoutPanelTop,
    Menu,
    NotebookPen,
    SlidersHorizontal,
    TableProperties,
    Waypoints,
    Workflow,
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
import { index as opportunitySupport } from '@/routes/opportunity-support';
import { index as legacySkills } from '@/routes/platform/skills';
import { index as portfolioIndex } from '@/routes/portfolio';
import { index as projectsIndex } from '@/routes/projects';
import { index as universityAdmins } from '@/routes/university/admins';
import { index as universitySettings } from '@/routes/university/settings';
import { index as universityStudents } from '@/routes/university/students';
import type {
    InstitutionMembershipStatus,
    NavItem,
    ShellContext,
} from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Beranda',
        href: dashboard(),
        icon: House,
    },
    {
        title: 'Proyek',
        href: projectsIndex(),
        icon: FolderKanban,
    },
    {
        title: 'Kontribusi',
        href: contributionsIndex(),
        icon: NotebookPen,
    },
    {
        title: 'Portofolio',
        href: portfolioIndex(),
        icon: GalleryVerticalEnd,
    },
    {
        title: 'Peringkat',
        href: leaderboardsIndex(),
        icon: ChartBar,
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
            label="Universitas"
            showLabel={false}
            name={membership?.institutionName ?? 'Afiliasi belum diajukan'}
            icon={Building2}
            logoSrc={membership ? '/images/university-uty.webp' : undefined}
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
                    : 'Buka aktivasi afiliasi universitas'
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
            label="Universitas"
            name={institutionName}
            icon={Building2}
            logoSrc="/images/university-uty.webp"
        />
    );
}

export function AppSidebar() {
    const page = usePage();
    const { auth, shell } = page.props;
    const path = page.url.split('?')[0];
    const workspace = auth.user?.workspace;
    const role = workspace?.role ?? 'student';
    const roleContext = getWorkspaceContext(role);
    const RoleIcon = roleContext.icon;
    const { isMobile, setOpenMobile } = useSidebar();
    const campusInstitution = workspace?.institution;
    const isCampusWorkspace =
        role === 'campus_admin' &&
        campusInstitution !== null &&
        campusInstitution !== undefined;
    const visibleMainNavItems: NavItem[] = isCampusWorkspace
        ? [
              {
                  title: 'Ringkasan',
                  href: campusOverview({
                      institution: campusInstitution.id,
                  }),
                  icon: LayoutPanelTop,
              },
              {
                  title: 'Mahasiswa',
                  href: universityStudents({
                      institution: campusInstitution.id,
                  }),
                  icon: ContactRound,
                  isActive:
                      path === universityStudents.url(campusInstitution.id) ||
                      path === affiliationIndex.url(campusInstitution.id),
              },
              {
                  title: 'Roster mahasiswa',
                  href: campusRoster({
                      institution: campusInstitution.id,
                  }),
                  icon: TableProperties,
              },
              {
                  title: 'Validasi kontribusi',
                  href: campusContributionsIndex({
                      institution: campusInstitution.id,
                  }),
                  icon: ClipboardCheck,
              },
              {
                  title: 'Peringkat',
                  href: leaderboardsIndex(),
                  icon: ChartBar,
              },
              {
                  title: 'Bantuan kesempatan',
                  href: opportunitySupport(campusInstitution.id),
                  icon: HandHeart,
              },
              {
                  title: 'Pengaturan',
                  href: universitySettings(campusInstitution.id),
                  icon: SlidersHorizontal,
                  isActive:
                      path === universitySettings.url(campusInstitution.id) ||
                      path.startsWith(
                          universitySettings.url(campusInstitution.id) + '/',
                      ) ||
                      path === universityAdmins.url(campusInstitution.id) ||
                      path === legacySkills.url(),
              },
          ]
        : shell.institutionMembership?.status === 'verified'
          ? mainNavItems
          : mainNavItems.filter(
                (item) =>
                    ![
                        'Proyek',
                        'Kontribusi',
                        'Portofolio',
                        'Peringkat',
                    ].includes(item.title),
            );
    const advancedNavItems: NavItem[] = isCampusWorkspace
        ? [
              {
                  title: 'Peninjauan inklusi',
                  href: campusInclusionIndex({
                      institution: campusInstitution.id,
                  }),
                  icon: Waypoints,
              },
              {
                  title: 'Pemetaan kredit',
                  href: campusCreditMappingsIndex({
                      institution: campusInstitution.id,
                  }),
                  icon: Blocks,
              },
              {
                  title: 'Sinkronisasi akademik',
                  href: campusIntegrationsIndex({
                      institution: campusInstitution.id,
                  }),
                  icon: Workflow,
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
                            isCampusWorkspace
                                ? 'SATU: Admin Universitas'
                                : 'SATU: Beranda'
                        }
                        href={
                            isCampusWorkspace
                                ? campusOverview({
                                      institution: campusInstitution.id,
                                  })
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
                            <Menu
                                aria-hidden="true"
                                className="size-5"
                                strokeWidth={1.75}
                            />
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
                        isCampusWorkspace
                            ? 'Navigasi Admin Universitas'
                            : 'Navigasi utama'
                    }
                    label={
                        isCampusWorkspace ? 'Admin Universitas' : 'Ruang kerja'
                    }
                    description={
                        role === 'student' &&
                        shell.institutionMembership?.status !== 'verified'
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
                    {isCampusWorkspace ? (
                        <CampusWorkspaceContext
                            institutionName={campusInstitution.name}
                        />
                    ) : (
                        <InstitutionMembershipContext shell={shell} />
                    )}
                </SidebarFooter>
            </SidebarContent>
        </Sidebar>
    );
}
