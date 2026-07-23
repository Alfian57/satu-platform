import { Link } from '@inertiajs/react';
import { useSidebar } from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { isMobile, setOpenMobile } = useSidebar();

    return (
        <nav aria-label="Navigasi utama">
            <p className="px-6 font-label text-label leading-none text-sidebar-foreground/60">
                Ruang kerja
            </p>
            <ul className="mt-3 grid">
                {items.map((item) => {
                    const isActive = isCurrentUrl(item.href);

                    return (
                        <li key={item.title}>
                            <Link
                                aria-current={isActive ? 'page' : undefined}
                                data-active={isActive}
                                href={item.href}
                                prefetch
                                onClick={() => {
                                    if (isMobile) {
                                        setOpenMobile(false);
                                    }
                                }}
                                className={cn(
                                    'relative flex min-h-control-lg items-center gap-3 px-6 text-sm font-medium transition-colors duration-fast ease-ledger motion-reduce:transition-none',
                                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-loading:opacity-60',
                                    isActive
                                        ? 'bg-sidebar-accent text-sidebar-primary before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-sidebar-primary'
                                        : 'text-sidebar-foreground/75',
                                )}
                            >
                                {item.icon && (
                                    <item.icon
                                        aria-hidden="true"
                                        className="size-4 shrink-0"
                                    />
                                )}
                                <span className="truncate">{item.title}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
