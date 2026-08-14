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
            <p className="px-3 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
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
                                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 data-loading:opacity-60',
                                    isActive
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-950/25'
                                        : 'text-slate-600',
                                )}
                            >
                                {Icon && (
                                    <span
                                        className={cn(
                                            'flex size-7 shrink-0 items-center justify-center rounded-lg',
                                            isActive
                                                ? 'bg-white/15'
                                                : 'bg-slate-100 text-slate-500',
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
