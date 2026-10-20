import { Link } from '@inertiajs/react';
import { Building2, CalendarDays, LibraryBig, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { index as admins } from '@/routes/university/admins';
import { index as settings, skills } from '@/routes/university/settings';

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
            className="grid grid-cols-2 gap-2 rounded-3xl border border-primary/10 bg-white p-3 shadow-sm lg:grid-cols-4"
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

export type University = { id: number; name: string };
export type PageData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
};

export function UniversityPagination({
    page,
    busy = false,
    onPage,
}: {
    page: Pick<PageData<unknown>, 'current_page' | 'last_page' | 'total'>;
    busy?: boolean;
    onPage: (page: number) => void;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
            <p className="text-muted-foreground">
                Halaman {page.current_page} dari {page.last_page}. {page.total}{' '}
                catatan.
            </p>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    className="min-h-11 cursor-pointer rounded-xl border border-input px-3 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={busy || page.current_page <= 1}
                    onClick={() => onPage(page.current_page - 1)}
                >
                    Sebelumnya
                </button>
                <button
                    type="button"
                    className="min-h-11 cursor-pointer rounded-xl border border-input px-3 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={busy || page.current_page >= page.last_page}
                    onClick={() => onPage(page.current_page + 1)}
                >
                    Berikutnya
                </button>
            </div>
        </div>
    );
}
