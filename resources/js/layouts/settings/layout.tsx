import { Link } from '@inertiajs/react';
import { CircleUserRound, ShieldCheck, Sun } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profil',
        href: edit(),
        icon: CircleUserRound,
    },
    {
        title: 'Keamanan',
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        title: 'Tampilan',
        href: editAppearance(),
        icon: Sun,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
            <header className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-white px-5 py-6 sm:px-7 sm:py-7">
                <div
                    aria-hidden="true"
                    className="absolute -top-28 -right-24 size-72 rounded-full bg-blue-100/70 blur-3xl"
                />
                <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.46fr)] lg:items-stretch lg:gap-10">
                    <div className="min-w-0">
                        <p className="flex items-center gap-2 text-xs font-bold tracking-[0.13em] text-blue-700 uppercase">
                            <span className="size-1.5 rounded-full bg-blue-600" />
                            Akun SATU
                        </p>
                        <h1 className="mt-4 max-w-[22ch] text-headline font-bold tracking-[-0.035em] text-balance text-slate-950">
                            Kelola akun dengan lebih tenang dan terkendali.
                        </h1>
                        <p className="mt-3 max-w-[66ch] text-sm leading-6 text-slate-600">
                            Perbarui identitas akun, jaga keamanan password, dan
                            pahami preferensi tampilan yang digunakan ruang
                            kerja SATU.
                        </p>
                    </div>

                    <div className="flex flex-col justify-end border-t border-slate-200 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                        <p className="text-xs font-bold tracking-[0.13em] text-slate-500 uppercase">
                            Ruang pribadi
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Perubahan identitas dan password hanya berlaku untuk
                            akunmu. Pengaturan karya dan afiliasi tetap dikelola
                            pada ruang masing-masing.
                        </p>
                    </div>
                </div>
            </header>

            <div className="mt-6 grid gap-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:items-start">
                <aside className="rounded-2xl border border-slate-200 bg-white p-3">
                    <nav className="grid gap-1" aria-label="Pengaturan">
                        {sidebarNavItems.map((item, index) => (
                            <Link
                                key={`${toUrl(item.href)}-${index}`}
                                href={item.href}
                                prefetch
                                className={cn(
                                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-fast ease-ledger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
                                    isCurrentOrParentUrl(item.href)
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                                )}
                            >
                                {item.icon && (
                                    <span
                                        className={cn(
                                            'flex size-8 shrink-0 items-center justify-center rounded-lg',
                                            isCurrentOrParentUrl(item.href)
                                                ? 'bg-white text-blue-700'
                                                : 'bg-slate-100 text-slate-500',
                                        )}
                                    >
                                        <item.icon
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </span>
                                )}
                                <span>{item.title}</span>
                            </Link>
                        ))}
                    </nav>
                </aside>

                <main className="min-w-0 lg:max-w-3xl">{children}</main>
            </div>
        </div>
    );
}
