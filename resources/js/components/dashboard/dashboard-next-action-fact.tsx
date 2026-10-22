import { Building2, CalendarDays, FileText, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardDocketFact, DashboardFactIcon } from '@/types';

const factIcons: Record<DashboardFactIcon, LucideIcon> = {
    building: Building2,
    calendar: CalendarDays,
    file: FileText,
    profile: UserRound,
    user: UserRound,
};

const factToneStyles = {
    correction: 'text-correction',
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    pending: 'text-pending',
    verified: 'text-verified',
} as const;

export function DashboardNextActionFact({
    fact,
}: {
    fact: DashboardDocketFact;
}) {
    const Icon = fact.icon ? factIcons[fact.icon] : FileText;

    return (
        <div className="dashboard-docket__fact flex min-w-0 items-start gap-3 border-t border-border/70 pt-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent/65 text-primary">
                <Icon aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                <dd
                    className={cn(
                        'mt-1 text-sm leading-5 font-medium wrap-anywhere',
                        factToneStyles[fact.tone ?? 'default'],
                    )}
                >
                    {fact.dateTime ? (
                        <time dateTime={fact.dateTime}>{fact.value}</time>
                    ) : (
                        fact.value
                    )}
                    {fact.supportingValue && (
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {fact.supportingValue}
                        </span>
                    )}
                </dd>
            </div>
        </div>
    );
}
