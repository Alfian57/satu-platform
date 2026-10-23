import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SettingsCardHeading({
    id,
    icon: Icon,
    title,
    description,
}: {
    id: string;
    icon: LucideIcon;
    title: string;
    description?: string;
}) {
    return (
        <header
            className={cn(
                'flex min-w-0 gap-3',
                description ? 'items-start' : 'items-center',
            )}
        >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-satu-orange-border bg-satu-orange-soft text-satu-orange-ink">
                <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
                <h2 id={id} className="text-title font-semibold">
                    {title}
                </h2>
                {description && (
                    <p className="mt-2 max-w-[60ch] text-sm leading-6 text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </header>
    );
}
