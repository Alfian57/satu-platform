import { usePage } from '@inertiajs/react';
import {
    Blocks,
    ChartBar,
    ClipboardCheck,
    ContactRound,
    FolderKanban,
    GalleryVerticalEnd,
    HandHeart,
    House,
    LayoutPanelTop,
    NotebookPen,
    SlidersHorizontal,
    TableProperties,
    Waypoints,
    Workflow,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
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
import type { NavItem } from '@/types';

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

export function useAppSidebar() {
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

    return {
        state: {
            auth,
            shell,
            role,
            roleContext,
            RoleIcon,
            isMobile,
            campusInstitution,
            isCampusWorkspace,
            visibleMainNavItems,
            advancedNavItems,
        },
        actions: {
            setOpenMobile,
        },
    };
}
