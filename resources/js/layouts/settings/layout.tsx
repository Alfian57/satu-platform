import { Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    CircleUserRound,
    Fingerprint,
    Settings2,
    ShieldCheck,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { AppPage } from '@/layouts/_components/app-page';
import StudentMenuHero from '@/layouts/_components/student-menu-hero';
import { cn } from '@/lib/utils';
import { CampusOperationHeader } from '@/pages/campus/_components/campus-operation-layout';
import { edit as editDataRights } from '@/routes/data-rights';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

const settingsItems = [
    {
        key: 'profile',
        title: 'Profil',
        description: 'Nama dan identitas masuk',
        href: editProfile(),
        icon: CircleUserRound,
    },
    {
        key: 'security',
        title: 'Keamanan',
        description: 'Password dan akses pribadi',
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        key: 'data-rights',
        title: 'Hak Data',
        description: 'Arsip dan kendali data',
        href: editDataRights(),
        icon: Fingerprint,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentUrl } = useCurrentUrl();
    const user = usePage().props.auth.user;
    const isStudent = user?.workspace.role === 'student';

    return (
        <AppPage>
            <div
                className="settings-workspace grid w-full min-w-0 gap-6"
                data-test="settings-root"
            >
                {!isStudent ? (
                    <CampusOperationHeader
                        theme="account"
                        icon={Settings2}
                        title="Pengaturan akun"
                        description="Kelola identitas masuk, password dan hak data akun pribadi. Pengaturan universitas dikelola terpisah."
                        institution={user?.workspace.institution?.name ?? null}
                        testId="settings-header"
                    />
                ) : (
                    <StudentMenuHero
                        icon={Settings2}
                        eyebrow="Pengaturan akun"
                        title="Ruang pribadimu, kendalimu."
                        description="Kelola identitas, jaga akses akun, dan tentukan kendali atas data pribadimu. Satu tempat, tertata untukmu."
                        pose="account-care"
                        theme="settings"
                        testId="settings-header"
                        size="lg"
                    />
                )}
                <nav
                    aria-label="Kategori pengaturan akun"
                    className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3"
                    data-test="settings-navigation"
                >
                    {settingsItems.map((item) => {
                        const active = isCurrentUrl(item.href);

                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                prefetch
                                aria-current={active ? 'page' : undefined}
                                data-test={'settings-nav-' + item.key}
                                className={cn(
                                    'group relative flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none sm:p-3.5',
                                    active
                                        ? 'border-primary/30 bg-primary/5 shadow-xs ring-1 ring-primary/20 dark:bg-primary/10'
                                        : 'border-border/80 bg-card shadow-xs hover:border-primary/25 hover:bg-accent/40',
                                )}
                            >
                                <span
                                    className={cn(
                                        'grid size-9.5 shrink-0 place-items-center rounded-xl border transition-colors duration-standard',
                                        active
                                            ? 'border-primary/20 bg-primary/10 text-primary dark:bg-primary/20'
                                            : 'border-border/70 bg-muted/40 text-muted-foreground group-hover:border-primary/20 group-hover:bg-accent group-hover:text-primary',
                                    )}
                                >
                                    <item.icon
                                        aria-hidden="true"
                                        className="size-4.5"
                                        strokeWidth={1.75}
                                    />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center justify-between gap-1.5">
                                        <span
                                            className={cn(
                                                'block truncate text-sm font-semibold tracking-tight',
                                                active
                                                    ? 'text-primary'
                                                    : 'text-foreground transition-colors group-hover:text-primary',
                                            )}
                                        >
                                            {item.title}
                                        </span>
                                        {active ? (
                                            <span className="sr-only">
                                                Aktif
                                            </span>
                                        ) : (
                                            <ArrowUpRight
                                                aria-hidden="true"
                                                className="size-3.5 shrink-0 text-muted-foreground/50 transition-all duration-fast group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                                            />
                                        )}
                                    </span>
                                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                        {item.description}
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </nav>
                <div
                    id="settings-content"
                    className="min-w-0"
                    data-test="settings-content"
                >
                    {children}
                </div>
            </div>
        </AppPage>
    );
}
