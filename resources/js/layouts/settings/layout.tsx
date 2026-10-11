import { Link } from '@inertiajs/react';
import { CircleUserRound, Settings2, ShieldCheck, Sun } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { AppPage } from '@/components/app-page';
import Mascot from '@/components/mascot';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

const settingsItems = [
    {
        key: 'profile',
        title: 'Profil',
        description: 'Nama dan identitas untuk masuk',
        href: editProfile(),
        icon: CircleUserRound,
    },
    {
        key: 'security',
        title: 'Keamanan',
        description: 'Password dan perlindungan akun',
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        key: 'appearance',
        title: 'Tampilan',
        description: 'Gaya ruang kerja yang digunakan',
        href: editAppearance(),
        icon: Sun,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <AppPage>
            <div
                className="grid w-full min-w-0 gap-6"
                data-test="settings-root"
            >
                <header
                    className="relative isolate min-w-0 overflow-hidden rounded-4xl border border-primary/10 bg-gradient-to-br from-[#E7F2FF] via-[#F2F8FF] to-white p-6 sm:p-8 lg:p-10"
                    data-test="settings-header"
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-20 -right-16 size-80 rounded-full bg-primary/5"
                    />
                    <div className="relative grid min-w-0 items-center gap-6 sm:grid-cols-[minmax(0,1fr)_9rem] lg:grid-cols-[minmax(0,1fr)_12rem]">
                        <div className="min-w-0">
                            <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary">
                                <Settings2
                                    aria-hidden="true"
                                    className="size-4 shrink-0"
                                />
                                Pengaturan akun
                            </p>
                            <h1 className="mt-4 max-w-[24ch] text-headline font-semibold tracking-tight text-balance">
                                Akunmu, tetap dalam kendalimu.
                            </h1>
                            <p className="mt-3 max-w-[65ch] text-sm leading-7 text-muted-foreground">
                                Atur identitas untuk masuk, perbarui password,
                                dan kenali tampilan ruang kerjamu. Pilih bagian
                                yang ingin kamu kelola di bawah ini.
                            </p>
                            <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="mt-1 size-4 shrink-0 text-primary"
                                />
                                <span>
                                    Pengaturan akun terpisah dari afiliasi
                                    kampus dan jangkauan karya.
                                </span>
                            </p>
                        </div>
                        <div className="pointer-events-none hidden justify-center sm:flex">
                            <Mascot
                                pose="guide"
                                priority
                                className="w-36 lg:w-48"
                            />
                        </div>
                    </div>
                </header>
                <nav
                    aria-label="Kategori pengaturan akun"
                    className="grid min-w-0 grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:gap-3 sm:p-3"
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
                                    'flex min-h-16 min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl p-2 text-center transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none sm:flex-row sm:justify-start sm:gap-3 sm:p-3 sm:text-left',
                                    active
                                        ? 'bg-accent text-primary'
                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                                )}
                            >
                                <span
                                    className={cn(
                                        'grid size-9 shrink-0 place-items-center rounded-xl sm:size-11',
                                        active
                                            ? 'bg-white text-primary'
                                            : 'bg-background text-muted-foreground',
                                    )}
                                >
                                    <item.icon
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-xs font-semibold [overflow-wrap:anywhere] sm:text-sm">
                                        {item.title}
                                    </span>
                                    <span className="mt-1 hidden text-xs leading-5 text-muted-foreground lg:block">
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
