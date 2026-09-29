import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Building2,
    CalendarDays,
    CircleCheck,
    Clock3,
    Compass,
    FileText,
    Sparkles,
    UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
    DashboardAction,
    DashboardDocketFact,
    DashboardFactIcon,
    DashboardNextAction,
    DashboardStatusTone,
} from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

type Props = {
    action: DashboardNextAction;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
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
        className: 'bg-correction-subtle text-correction-subtle-foreground',
    },
    pending: {
        icon: Clock3,
        className: 'bg-pending-subtle text-pending-subtle-foreground',
    },
    neutral: {
        icon: Sparkles,
        className: 'bg-accent text-accent-foreground',
    },
    verified: {
        icon: CircleCheck,
        className: 'bg-verified-subtle text-verified-subtle-foreground',
    },
};

const factToneStyles = {
    correction: 'text-correction',
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    pending: 'text-pending',
    verified: 'text-verified',
} as const;

function FactRow({ fact }: { fact: DashboardDocketFact }) {
    const Icon = fact.icon ? factIcons[fact.icon] : FileText;

    return (
        <div className="flex min-w-0 items-start gap-3 rounded-2xl bg-background/80 p-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
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

function ActionControl({
    action,
    dataTest,
    getActionHref,
    onAction,
    primary = false,
}: {
    action: DashboardAction;
    dataTest: string;
    getActionHref: Props['getActionHref'];
    onAction: Props['onAction'];
    primary?: boolean;
}) {
    const href = getActionHref(action);
    const content = (
        <>
            {action.label}
            <ArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
            />
        </>
    );
    const className = cn(
        'group min-h-11 w-full cursor-pointer rounded-full px-5 text-sm font-semibold sm:w-auto',
        primary ? 'shadow-sm' : 'text-primary',
    );

    if (href !== null) {
        return (
            <Button
                asChild
                variant={primary ? 'default' : 'ghost'}
                className={className}
            >
                <Link href={href} data-test={dataTest}>
                    {content}
                </Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant={primary ? 'default' : 'ghost'}
            className={className}
            data-test={dataTest}
            onClick={() => onAction(action)}
        >
            {content}
        </Button>
    );
}

export function DashboardNextAction({
    action,
    getActionHref,
    onAction,
}: Props) {
    const status = statusStyles[action.statusTone];
    const StatusIcon = status.icon;

    return (
        <section
            aria-labelledby="dashboard-next-action"
            className="scroll-mt-24 rounded-3xl border border-white bg-card p-5 shadow-sm sm:p-6"
            data-test="dashboard-docket"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Compass aria-hidden="true" className="size-4" />
                    Langkah utama
                </p>
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
                        status.className,
                    )}
                >
                    <StatusIcon aria-hidden="true" className="size-3.5" />
                    {action.statusLabel}
                </span>
            </div>

            <h2
                id="dashboard-next-action"
                className="mt-4 scroll-mt-24 text-xl leading-snug font-bold tracking-tight text-foreground sm:text-2xl"
                tabIndex={-1}
            >
                {action.title}
            </h2>

            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>{action.category}</span>
                <span aria-hidden="true">·</span>
                <span>
                    Dicatat{' '}
                    <time dateTime={action.recordedAtIso}>
                        {action.recordedAt}
                    </time>
                </span>
            </p>

            <dl className="mt-5 grid gap-2.5 2xl:grid-cols-2">
                {action.facts.map((fact) => (
                    <FactRow key={fact.label} fact={fact} />
                ))}
            </dl>

            {(action.primaryAction || action.secondaryAction) && (
                <div className="mt-5 flex flex-col gap-2 border-t border-border/50 pt-5 sm:flex-row sm:flex-wrap sm:items-center">
                    {action.primaryAction && (
                        <ActionControl
                            action={action.primaryAction}
                            dataTest="dashboard-primary-action"
                            getActionHref={getActionHref}
                            onAction={onAction}
                            primary
                        />
                    )}
                    {action.secondaryAction && (
                        <ActionControl
                            action={action.secondaryAction}
                            dataTest="dashboard-secondary-action"
                            getActionHref={getActionHref}
                            onAction={onAction}
                        />
                    )}
                </div>
            )}
        </section>
    );
}
