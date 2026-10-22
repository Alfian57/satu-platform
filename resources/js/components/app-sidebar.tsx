import { Link } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { CampusWorkspaceContext } from '@/components/app-sidebar/campus-workspace-context';
import { InstitutionMembershipContext } from '@/components/app-sidebar/institution-membership-context';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import { NavMain } from '@/components/nav-main';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import { useAppSidebar } from '@/hooks/use-app-sidebar';
import { dashboard } from '@/routes';
import { show as campusOverview } from '@/routes/campus/overview';

export function AppSidebar() {
    const { state, actions } = useAppSidebar();
    const {
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
    } = state;

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
                                      institution: campusInstitution!.id,
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
                            onClick={() => actions.setOpenMobile(false)}
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
                            institutionName={campusInstitution!.name}
                        />
                    ) : (
                        <InstitutionMembershipContext shell={shell} />
                    )}
                </SidebarFooter>
            </SidebarContent>
        </Sidebar>
    );
}
