import type { LucideIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';

export function SettingsHelpCard({
    children,
    icon: Icon,
    title,
    eyebrow,
}: PropsWithChildren<{ icon: LucideIcon; title: string; eyebrow: string }>) {
    return (
        <aside
            aria-label={title}
            className="settings-help grid min-w-0 content-start gap-5 rounded-2xl border border-satu-orange-border/80 p-5 sm:p-6"
        >
            <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-satu-orange-border bg-card text-satu-orange-ink">
                    <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-satu-orange-ink">
                        {eyebrow}
                    </p>
                    <h2 className="mt-1 text-title font-semibold">{title}</h2>
                </div>
            </div>
            {children}
        </aside>
    );
}
