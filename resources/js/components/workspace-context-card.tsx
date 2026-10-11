import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function WorkspaceContextCard({
    label,
    name,
    icon: Icon,
    children,
}: {
    label: string;
    name: string;
    icon: LucideIcon;
    children?: ReactNode;
}) {
    return (
        <div
            aria-label={label}
            data-test="workspace-context"
            className="flex min-w-0 items-start gap-3 rounded-2xl border border-primary/10 bg-linear-to-br from-card to-accent/65 p-3.5 shadow-sm"
        >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-card text-primary">
                <Icon aria-hidden="true" className="size-[1.125rem]" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[0.6875rem] leading-4 font-medium text-muted-foreground">
                    {label}
                </p>
                <p className="mt-1 text-sm leading-6 font-semibold [overflow-wrap:anywhere] text-foreground">
                    {name}
                </p>
                {children && <div className="mt-2">{children}</div>}
            </div>
        </div>
    );
}
