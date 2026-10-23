import { Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import AppLogo from '@/layouts/_components/app-logo';
import { CampusWorkspaceContext } from '@/layouts/_components/app-sidebar/campus-workspace-context';
import { InstitutionMembershipContext } from '@/layouts/_components/app-sidebar/institution-membership-context';
import { NavMain } from '@/layouts/_components/nav-main';
import { useAppSidebar } from '@/layouts/_hooks/use-app-sidebar';
import { dashboard } from '@/routes';
import { show as campusOverview } from '@/routes/campus/overview';

export function AppSidebar() {
    const { state, actions } = useAppSidebar();
    const {
        auth,
        shell,
        role,
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
            <SidebarHeader className="flex h-16 shrink-0 flex-row items-center justify-between border-b border-sidebar-border/80 bg-sidebar px-4">
                <div className="flex w-full min-w-0 items-center justify-between gap-2.5">
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
                        className="flex min-w-0 flex-1 cursor-pointer items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
                            className="size-8 shrink-0 cursor-pointer rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                            aria-label="Tutup navigasi"
                            data-test="sidebar-close"
                            onClick={() => actions.setOpenMobile(false)}
                        >
                            <X
                                aria-hidden="true"
                                className="size-4"
                                strokeWidth={2}
                            />
                        </Button>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent className="gap-6 pt-4">
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
            </SidebarContent>

            <SidebarFooter className="shrink-0 border-t border-sidebar-border/80 bg-sidebar/95 p-3">
                {isCampusWorkspace ? (
                    <CampusWorkspaceContext
                        institutionName={campusInstitution!.name}
                    />
                ) : (
                    <InstitutionMembershipContext shell={shell} />
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
