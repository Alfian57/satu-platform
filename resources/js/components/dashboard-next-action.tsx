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
    { icon: LucideIcon; className: string }
> = {
    correction: {
        icon: AlertCircle,
        className:
            'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
    },
    pending: {
        icon: Clock3,
        className:
            'border-pending/30 bg-pending-subtle text-pending-subtle-foreground',
    },
    neutral: {
        icon: FileText,
        className: 'border-primary/25 bg-accent text-accent-foreground',
    },
    verified: {
        icon: CircleCheck,
        className:
            'border-verified/30 bg-verified-subtle text-verified-subtle-foreground',
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
                <span className="font-semibold">{value}</span>
                {fact.supportingValue && (
                    <span className="text-muted-foreground">
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
        <div className="grid border-b border-border last:border-b-0 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
            <dt className="border-b border-border bg-muted/45 px-4 py-2.5 font-label text-label font-semibold text-muted-foreground sm:border-r sm:border-b-0 sm:px-5 sm:py-3 xl:py-1.5">
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
            <div className="grid overflow-hidden border border-border bg-card sm:grid-cols-[7.5rem_minmax(0,1fr)]">
                <div
                    className={cn(
                        'flex items-center gap-3 border-b px-4 py-4 sm:flex-col sm:justify-start sm:border-r sm:border-b-0 sm:px-4 sm:py-6 sm:text-center xl:py-5',
                        status.className,
                    )}
                >
                    <StatusIcon
                        aria-hidden="true"
                        className="size-8 shrink-0 stroke-[1.6]"
                    />
                    <p className="text-sm leading-5 font-bold">
                        {action.statusLabel}
                    </p>
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-border px-4 py-3 sm:px-5 xl:py-2">
                        <p className="min-w-0 font-label text-label font-semibold wrap-anywhere">
                            {action.category}
                            <span
                                aria-hidden="true"
                                className="px-2 text-muted-foreground"
                            >
                                /
                            </span>
                            <span className="text-primary">
                                {action.reference}
                            </span>
                        </p>
                        <p className="font-label text-label text-muted-foreground">
                            Dicatat{' '}
                            <time dateTime={action.recordedAtIso}>
                                {action.recordedAt}
                            </time>
                        </p>
                    </div>

                    <div className="border-b border-border px-4 py-5 sm:px-5 sm:py-5 xl:py-3">
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
                        <div className="grid gap-2 border-t border-border px-4 py-4 sm:flex sm:flex-wrap sm:items-center sm:px-5 xl:py-2">
                            {primaryActionLabel && (
                                <Button
                                    type="button"
                                    size="lg"
                                    className="w-full sm:w-auto"
                                    data-test="dashboard-primary-action"
                                    onClick={() =>
                                        onDemoAction(primaryActionLabel)
                                    }
                                >
                                    <PencilLine aria-hidden="true" />
                                    {primaryActionLabel}
                                </Button>
                            )}
                            {secondaryActionLabel && (
                                <Button
                                    type="button"
                                    size="lg"
                                    variant="ghost"
                                    className="w-full text-primary hover:text-primary sm:w-auto"
                                    onClick={() =>
                                        onDemoAction(secondaryActionLabel)
                                    }
                                >
                                    {secondaryActionLabel}
                                    <ArrowRight aria-hidden="true" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
