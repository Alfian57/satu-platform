import { Link } from '@inertiajs/react';
import { Building2, CalendarDays, LibraryBig, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { index as admins } from '@/routes/university/admins';
import { index as settings, skills } from '@/routes/university/settings';

export type University = { id: number; name: string };
export type PageData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from?: number;
    to?: number;
    per_page?: number;
};

export function UniversitySettingsNav({
    institution,
    active,
}: {
    institution: number;
    active: 'profile' | 'semester' | 'skills' | 'admins';
}) {
    const items = [
        {
            key: 'profile',
            title: 'Profil universitas',
            href: settings(institution),
            icon: Building2,
        },
        {
            key: 'semester',
            title: 'Semester',
            href:
                settings.url(institution, { query: { section: 'semester' } }) +
                '#semester',
            icon: CalendarDays,
        },
        {
            key: 'skills',
            title: 'Katalog keahlian',
            href: skills(institution),
            icon: LibraryBig,
        },
        {
            key: 'admins',
            title: 'Akun admin',
            href: admins(institution),
            icon: ShieldCheck,
        },
    ];

    return (
        <nav
            aria-label="Kategori pengaturan universitas"
            className="grid grid-cols-2 gap-2 rounded-3xl border border-primary/10 bg-card p-3 shadow-sm lg:grid-cols-4"
        >
            {items.map(({ key, title, href, icon: Icon }) => (
                <Link
                    key={key}
                    href={href}
                    aria-current={key === active ? 'page' : undefined}
                    className={cn(
                        'flex min-h-11 cursor-pointer items-center gap-2 rounded-xl p-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring',
                        key === active
                            ? 'bg-accent text-primary'
                            : 'text-muted-foreground hover:bg-accent/40',
                    )}
                >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    <span className="min-w-0 wrap-anywhere">{title}</span>
                </Link>
            ))}
        </nav>
    );
}
