import { Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Check,
    CircleUserRound,
    Fingerprint,
    Settings2,
    ShieldCheck,
    Sun,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { AppPage } from '@/layouts/_components/app-page';
import StudentMenuHero from '@/layouts/_components/student-menu-hero';
import { cn } from '@/lib/utils';
import { CampusOperationHeader } from '@/pages/campus/_components/campus-operation-layout';
import { edit as editAppearance } from '@/routes/appearance';
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
        key: 'appearance',
        title: 'Tampilan',
        description: 'Kenali ruang kerjamu',
        href: editAppearance(),
        icon: Sun,
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
                        note={
                            isStudent
                                ? 'Pengaturan ini tidak mengubah afiliasi atau jangkauan portofoliomu.'
                                : 'Pengaturan akun pribadi terpisah dari Pengaturan universitas.'
                        }
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-satu-orange-border bg-satu-orange-soft px-3 py-2 text-xs font-medium text-satu-orange-ink">
                            <Fingerprint
                                aria-hidden="true"
                                className="size-4 shrink-0"
                            />
                            Akun pribadi
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Pilih bagian yang ingin kamu kelola.
                        </span>
                    </StudentMenuHero>
                )}
                <nav
                    aria-label="Kategori pengaturan akun"
                    className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4"
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
                                    'group flex min-h-28 min-w-0 cursor-pointer flex-col gap-3 rounded-[20px] border p-4 text-left transition-colors duration-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none sm:p-5',
                                    active
                                        ? 'border-primary/25 bg-accent/70'
                                        : 'border-border bg-card hover:border-primary/25 hover:bg-accent/30',
                                )}
                            >
                                <span className="flex w-full items-center justify-between gap-2">
                                    <span
                                        className={cn(
                                            'grid size-10 shrink-0 place-items-center rounded-xl border',
                                            active
                                                ? 'border-primary/10 bg-white text-primary'
                                                : 'border-border bg-background text-muted-foreground',
                                        )}
                                    >
                                        <item.icon
                                            aria-hidden="true"
                                            className="size-5"
                                            strokeWidth={1.75}
                                        />
                                    </span>
                                    {active ? (
                                        <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                                            <Check
                                                aria-hidden="true"
                                                className="size-3.5"
                                            />
                                            Aktif
                                        </span>
                                    ) : (
                                        <ArrowUpRight
                                            aria-hidden="true"
                                            className="size-4 text-muted-foreground"
                                        />
                                    )}
                                </span>
                                <span className="min-w-0">
                                    <span
                                        className={cn(
                                            'block text-sm font-semibold',
                                            active
                                                ? 'text-primary'
                                                : 'text-foreground',
                                        )}
                                    >
                                        {item.title}
                                    </span>
                                    <span className="mt-1 block text-xs leading-5 wrap-anywhere text-muted-foreground">
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
