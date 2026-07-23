import {
    AlertCircle,
    ArrowRight,
    Building2,
    CalendarDays,
    CircleCheck,
    Clock3,
    FileText,
    PencilLine,
    UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
    DashboardDocketFact,
    DashboardFactIcon,
    DashboardNextAction,
    DashboardStatusTone,
} from '@/types';

type Props = {
    action: DashboardNextAction;
    onDemoAction: (actionLabel: string) => void;
};

const factIcons: Record<DashboardFactIcon, LucideIcon> = {
    building: Building2,
    calendar: CalendarDays,
    file: FileText,
    profile: UserRound,
    user: UserRound,
};

const statusStyles: Record<
    DashboardStatusTone,
    { icon: LucideIcon; className: string; iconContainerClass: string }
> = {
    correction: {
        icon: AlertCircle,
        className:
            'border-correction/30 bg-gradient-to-b from-correction-subtle via-correction-subtle/90 to-correction-subtle/70 text-correction-subtle-foreground',
        iconContainerClass:
            'p-2.5 rounded-lg bg-correction/15 text-correction ring-1 ring-correction/25 shadow-2xs',
    },
    pending: {
        icon: Clock3,
        className:
            'border-pending/30 bg-gradient-to-b from-pending-subtle via-pending-subtle/90 to-pending-subtle/70 text-pending-subtle-foreground',
        iconContainerClass:
            'p-2.5 rounded-lg bg-pending/15 text-pending ring-1 ring-pending/25 shadow-2xs',
    },
    neutral: {
        icon: FileText,
        className:
            'border-primary/25 bg-gradient-to-b from-accent via-accent/90 to-accent/70 text-accent-foreground',
        iconContainerClass:
            'p-2.5 rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25 shadow-2xs',
    },
    verified: {
        icon: CircleCheck,
        className:
            'border-verified/30 bg-gradient-to-b from-verified-subtle via-verified-subtle/90 to-verified-subtle/70 text-verified-subtle-foreground',
        iconContainerClass:
            'p-2.5 rounded-lg bg-verified/15 text-verified ring-1 ring-verified/25 shadow-2xs',
    },
};

const factToneStyles = {
    correction: 'text-correction',
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    pending: 'text-pending',
    verified: 'text-verified',
} as const;

function FactValue({ fact }: { fact: DashboardDocketFact }) {
    const Icon = fact.icon ? factIcons[fact.icon] : null;
    const value = fact.dateTime ? (
        <time dateTime={fact.dateTime}>{fact.value}</time>
    ) : (
        fact.value
    );
    const isHighlightTone =
        fact.tone === 'correction' ||
        fact.tone === 'pending' ||
        fact.tone === 'verified';

    return (
        <span
            className={cn(
                'flex min-w-0 items-start gap-2',
                factToneStyles[fact.tone ?? 'default'],
            )}
        >
            {Icon && (
                <Icon aria-hidden="true" className="mt-1 size-4 shrink-0" />
            )}
            <span className="min-w-0 wrap-anywhere">
                {isHighlightTone ? (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold',
                            fact.tone === 'correction' &&
                                'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
                            fact.tone === 'pending' &&
                                'border-pending/30 bg-pending-subtle text-pending-subtle-foreground',
                            fact.tone === 'verified' &&
                                'border-verified/30 bg-verified-subtle text-verified-subtle-foreground',
                        )}
                    >
                        {value}
                    </span>
                ) : (
                    <span className="font-semibold">{value}</span>
                )}
                {fact.supportingValue && (
                    <span className="font-normal text-muted-foreground">
                        {' '}
                        · {fact.supportingValue}
                    </span>
                )}
            </span>
        </span>
    );
}

function FactRow({ fact }: { fact: DashboardDocketFact }) {
    return (
        <div className="grid border-b border-border/80 transition-colors hover:bg-muted/15 last:border-b-0 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
            <dt className="border-b border-border/80 bg-muted/40 px-4 py-2.5 font-label text-label font-semibold uppercase tracking-wider text-muted-foreground sm:border-r sm:border-b-0 sm:px-5 sm:py-3 xl:py-1.5">
                {fact.label}
            </dt>
            <dd className="min-w-0 px-4 py-3 text-sm leading-6 font-medium sm:px-5 xl:py-1.5">
                <FactValue fact={fact} />
            </dd>
        </div>
    );
}

export function DashboardNextAction({ action, onDemoAction }: Props) {
    const status = statusStyles[action.statusTone];
    const StatusIcon = status.icon;
    const primaryActionLabel = action.primaryActionLabel;
    const secondaryActionLabel = action.secondaryActionLabel;
    const hasActions =
        primaryActionLabel !== undefined || secondaryActionLabel !== undefined;

    return (
        <section
            aria-labelledby="dashboard-next-action"
            data-test="dashboard-docket"
        >
            <div className="grid overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-shadow duration-standard hover:shadow-md sm:grid-cols-[7.5rem_minmax(0,1fr)]">
                <div
                    className={cn(
                        'flex items-center gap-3 border-b px-4 py-4 sm:flex-col sm:justify-start sm:border-r sm:border-b-0 sm:px-4 sm:py-6 sm:text-center xl:py-5',
                        status.className,
                    )}
                >
                    <span className={status.iconContainerClass}>
                        <StatusIcon
                            aria-hidden="true"
                            className="size-7 shrink-0 stroke-[1.8]"
                        />
                    </span>
                    <p className="text-sm leading-5 font-bold tracking-tight">
                        {action.statusLabel}
                    </p>
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-border/80 bg-muted/20 px-4 py-3 sm:px-5 xl:py-2">
                        <p className="min-w-0 font-label text-label font-semibold wrap-anywhere">
                            <span className="text-muted-foreground">
                                {action.category}
                            </span>
                            <span
                                aria-hidden="true"
                                className="px-2 text-muted-foreground"
                            >
                                /
                            </span>
                            <span className="inline-flex items-center rounded border border-primary/25 bg-accent/80 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                                {action.reference}
                            </span>
                        </p>
                        <p className="flex items-center gap-1.5 font-label text-label text-muted-foreground">
                            <Clock3
                                aria-hidden="true"
                                className="size-3.5 text-muted-foreground"
                            />
                            <span>Dicatat</span>{' '}
                            <time
                                dateTime={action.recordedAtIso}
                                className="font-medium"
                            >
                                {action.recordedAt}
                            </time>
                        </p>
                    </div>

                    <div className="border-b border-border/80 px-4 py-5 sm:px-5 sm:py-5 xl:py-2.5">
                        <h2
                            id="dashboard-next-action"
                            className="max-w-[30ch] text-headline font-bold text-balance wrap-anywhere"
                        >
                            {action.title}
                        </h2>
                    </div>

                    <dl>
                        {action.facts.map((fact) => (
                            <FactRow key={fact.label} fact={fact} />
                        ))}
                    </dl>

                    {hasActions && (
                        <div className="grid gap-2.5 border-t border-border/80 bg-muted/10 px-4 py-4 sm:flex sm:flex-wrap sm:items-center sm:px-5 xl:py-2">
                            {primaryActionLabel && (
                                <Button
                                    type="button"
                                    size="lg"
                                    className="w-full font-semibold shadow-sm transition-all duration-fast hover:-translate-y-0.5 hover:shadow sm:w-auto"
                                    data-test="dashboard-primary-action"
                                    onClick={() =>
                                        onDemoAction(primaryActionLabel)
                                    }
                                >
                                    <PencilLine
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    {primaryActionLabel}
                                </Button>
                            )}
                            {secondaryActionLabel && (
                                <Button
                                    type="button"
                                    size="lg"
                                    variant="ghost"
                                    className="group w-full text-primary transition-all duration-fast hover:bg-accent/80 hover:text-primary sm:w-auto"
                                    onClick={() =>
                                        onDemoAction(secondaryActionLabel)
                                    }
                                >
                                    {secondaryActionLabel}
                                    <ArrowRight
                                        aria-hidden="true"
                                        className="size-4 transition-transform group-hover:translate-x-1"
                                    />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
