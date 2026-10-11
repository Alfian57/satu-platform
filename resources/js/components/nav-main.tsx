import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({
    items = [],
    label = 'Ruang kerja',
    ariaLabel = 'Navigasi utama',
    description,
    collapsible = false,
}: {
    items: NavItem[];
    label?: string;
    ariaLabel?: string;
    description?: string;
    collapsible?: boolean;
}) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { isMobile, setOpenMobile } = useSidebar();

    const content = (
        <>
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
                                    'group/nav-item relative flex min-h-13 cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm font-medium transition-[color,background-color,border-color] duration-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-loading:opacity-60 motion-reduce:transition-none',
                                    isActive
                                        ? 'border-primary/15 bg-linear-to-r from-accent to-accent/60 font-semibold text-primary shadow-sm'
                                        : 'text-muted-foreground hover:border-primary/10 hover:bg-accent/35 hover:text-foreground',
                                )}
                            >
                                {Icon && (
                                    <span
                                        className={cn(
                                            'flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors duration-standard motion-reduce:transition-none',
                                            isActive
                                                ? 'border-white bg-card text-primary shadow-xs'
                                                : 'border-border/60 bg-background/80 text-muted-foreground group-hover/nav-item:border-primary/10 group-hover/nav-item:bg-card group-hover/nav-item:text-primary',
                                        )}
                                    >
                                        <Icon
                                            aria-hidden="true"
                                            className="size-[1.125rem]"
                                        />
                                    </span>
                                )}
                                <span className="min-w-0 flex-1 leading-5 break-words">
                                    {item.title}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
            {description && (
                <p className="mt-4 px-3 text-xs leading-5 text-muted-foreground">
                    {description}
                </p>
            )}
        </>
    );

    return (
        <nav aria-label={ariaLabel} className="px-3">
            {collapsible ? (
                <details
                    className="group/advanced border-t border-border pt-3"
                    open={
                        items.some((item) => isCurrentOrParentUrl(item.href)) ||
                        undefined
                    }
                    data-test="advanced-navigation"
                >
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-accent/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                        {label}
                        <ChevronDown
                            aria-hidden="true"
                            className="size-4 shrink-0 group-open/advanced:rotate-180"
                        />
                    </summary>
                    {content}
                </details>
            ) : (
                <>
                    <p className="px-3 text-xs font-semibold text-muted-foreground">
                        {label}
                    </p>
                    {content}
                </>
            )}
        </nav>
    );
}
