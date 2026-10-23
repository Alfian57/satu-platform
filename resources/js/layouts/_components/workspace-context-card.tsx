import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function WorkspaceContextCard({
    label,
    name,
    icon: Icon,
    logoSrc,
    showLabel = true,
    actionIndicator,
    children,
}: {
    label: string;
    name: string;
    icon: LucideIcon;
    logoSrc?: string;
    showLabel?: boolean;
    actionIndicator?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div
            aria-label={label}
            data-test="workspace-context"
            className="group relative flex min-w-0 items-center gap-3 rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/50 p-2.5 shadow-2xs transition-all duration-200 hover:border-primary/20 hover:bg-sidebar-accent hover:shadow-xs"
        >
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background/90 p-1 shadow-2xs">
                {logoSrc ? (
                    <img
                        src={logoSrc}
                        alt=""
                        aria-hidden="true"
                        width={256}
                        height={256}
                        className="size-7.5 object-contain"
                        decoding="async"
                        draggable={false}
                        data-test="university-logo"
                    />
                ) : (
                    <Icon aria-hidden="true" className="size-5 text-primary" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                {showLabel && (
                    <p className="text-[0.625rem] leading-none font-semibold tracking-wider text-muted-foreground/80 uppercase">
                        {label}
                    </p>
                )}
                <p
                    className={cn(
                        'text-xs leading-snug font-bold [overflow-wrap:anywhere] text-foreground transition-colors group-hover:text-primary',
                        showLabel ? 'mt-1 line-clamp-1' : 'line-clamp-2',
                    )}
                    title={name}
                >
                    {name}
                </p>
                {children && (
                    <div className="mt-1 flex items-center">{children}</div>
                )}
            </div>
            {actionIndicator && (
                <div className="shrink-0">{actionIndicator}</div>
            )}
        </div>
    );
}
