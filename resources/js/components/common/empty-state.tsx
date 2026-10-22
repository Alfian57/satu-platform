import type { LucideIcon } from 'lucide-react';
import { FolderOpen } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
    title: string;
    description?: string | ReactNode;
    icon?:
        | LucideIcon
        | ComponentType<{
              className?: string;
              'aria-hidden'?: boolean | 'true' | 'false';
          }>
        | null;
    action?: ReactNode;
    secondaryAction?: ReactNode;
    borderStyle?: 'dashed' | 'solid' | 'none';
    className?: string;
    children?: ReactNode;
}

export function EmptyState({
    title,
    description,
    icon: Icon = FolderOpen,
    action,
    secondaryAction,
    borderStyle = 'dashed',
    className,
    children,
}: EmptyStateProps) {
    return (
        <section
            data-slot="empty-state"
            aria-label={title}
            className={cn(
                'flex min-w-0 flex-col items-center justify-center rounded-3xl bg-card p-8 text-center shadow-xs sm:p-12',
                borderStyle === 'dashed' &&
                    'border border-dashed border-border',
                borderStyle === 'solid' && 'border border-solid border-border',
                borderStyle === 'none' && 'border-0',
                className,
            )}
        >
            {Icon && (
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-accent/50 text-primary shadow-xs">
                    <Icon aria-hidden="true" className="size-7" />
                </div>
            )}

            <h3 className="max-w-[48ch] text-title font-semibold tracking-tight text-foreground">
                {title}
            </h3>

            {description && (
                <div className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
                    {typeof description === 'string' ? (
                        <p>{description}</p>
                    ) : (
                        description
                    )}
                </div>
            )}

            {(action || secondaryAction) && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {action}
                    {secondaryAction}
                </div>
            )}

            {children && <div className="mt-6 w-full max-w-md">{children}</div>}
        </section>
    );
}
