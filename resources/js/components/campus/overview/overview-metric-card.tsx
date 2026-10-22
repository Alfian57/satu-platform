import type { ReactNode } from 'react';

interface OverviewMetricCardProps {
    title: string;
    value: ReactNode;
    icon: ReactNode;
    children: ReactNode;
    description: string;
}

export function OverviewMetricCard({
    title,
    value,
    icon,
    children,
    description,
}: OverviewMetricCardProps) {
    return (
        <article className="min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-base leading-6 font-semibold">{title}</h3>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    {icon}
                </span>
            </div>
            <p className="mt-2 text-3xl leading-tight font-bold tracking-tight break-words">
                {value}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {description}
            </p>
            <div className="mt-3 border-t border-border pt-3">{children}</div>
        </article>
    );
}
