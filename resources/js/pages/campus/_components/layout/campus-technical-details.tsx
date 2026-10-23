import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export function CampusTechnicalDetails({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <details className="group min-w-0 rounded-2xl border border-border bg-accent/30">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                {title}
                <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
            </summary>
            <div className="min-w-0 border-t border-border p-4 text-sm leading-6 text-muted-foreground">
                {children}
            </div>
        </details>
    );
}
