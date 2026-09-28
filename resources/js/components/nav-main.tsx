import { Link } from '@inertiajs/react';
import { useSidebar } from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({
    items = [],
    label = 'Ruang kerja',
    ariaLabel = 'Navigasi utama',
}: {
    items: NavItem[];
    label?: string;
    ariaLabel?: string;
}) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { isMobile, setOpenMobile } = useSidebar();

    return (
        <nav aria-label={ariaLabel} className="px-3">
            <p className="px-3 text-xs font-semibold text-muted-foreground">
                {label}
            </p>
            <ul className="mt-3 grid gap-1.5">
                {items.map((item) => {
                    const isActive = isCurrentOrParentUrl(item.href);
                    const Icon = item.icon;

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
                                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-loading:opacity-60 motion-reduce:transition-none',
                                    isActive
                                        ? 'bg-sidebar-accent text-primary shadow-xs'
                                        : 'text-muted-foreground hover:bg-white hover:text-primary',
                                )}
                            >
                                {Icon && (
                                    <span
                                        className={cn(
                                            'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                                            isActive
                                                ? 'bg-white text-primary'
                                                : 'bg-white/70 text-muted-foreground',
                                        )}
                                    >
                                        <Icon
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </span>
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
