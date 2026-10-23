import type { LucideIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

export function SettingsHelpCard({
    children,
    icon: Icon,
    title,
    eyebrow,
}: PropsWithChildren<{ icon: LucideIcon; title: string; eyebrow?: string }>) {
    return (
        <aside
            aria-label={title}
            className="settings-help grid min-w-0 content-start gap-5 rounded-2xl border border-satu-orange-border/80 p-5 sm:p-6"
        >
            <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-satu-orange-border bg-card text-satu-orange-ink">
                    <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                    {eyebrow && (
                        <p className="text-xs font-semibold text-satu-orange-ink">
                            {eyebrow}
                        </p>
                    )}
                    <h2
                        className={cn(
                            'text-base font-semibold text-foreground sm:text-lg',
                            eyebrow && 'mt-0.5',
                        )}
                    >
                        {title}
                    </h2>
                </div>
            </div>
            {children}
        </aside>
    );
}
