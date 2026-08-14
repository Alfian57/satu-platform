import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
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
    { icon: LucideIcon; className: string; iconContainerClass: string }
> = {
    correction: {
        icon: AlertCircle,
        className: 'bg-rose-50 text-rose-800',
        iconContainerClass:
            'rounded-xl border border-rose-200 bg-white p-2.5 text-rose-600 shadow-sm',
    },
    pending: {
        icon: Clock3,
        className: 'bg-amber-50 text-amber-900',
        iconContainerClass:
            'rounded-xl border border-amber-200 bg-white p-2.5 text-amber-700 shadow-sm',
    },
    neutral: {
        icon: FileText,
        className: 'bg-blue-50 text-blue-900',
        iconContainerClass:
            'rounded-xl border border-blue-200 bg-white p-2.5 text-blue-700 shadow-sm',
    },
    verified: {
        icon: CircleCheck,
        className: 'bg-emerald-50 text-emerald-900',
        iconContainerClass:
            'rounded-xl border border-emerald-200 bg-white p-2.5 text-emerald-700 shadow-sm',
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
                        {' · '}
                        {fact.supportingValue}
                    </span>
                )}
            </span>
        </span>
    );
}

function FactRow({ fact }: { fact: DashboardDocketFact }) {
    return (
        <div className="grid border-b border-slate-100 transition-colors last:border-b-0 hover:bg-blue-50/55 sm:grid-cols-[10.5rem_minmax(0,1fr)]">
            <dt className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 font-label text-label font-semibold tracking-wider text-slate-500 uppercase sm:border-r sm:border-b-0 sm:px-5 sm:py-3 xl:py-1.5">
                {fact.label}
            </dt>
            <dd className="min-w-0 px-4 py-3 text-sm leading-6 font-medium text-slate-800 sm:px-5 xl:py-1.5">
                <FactValue fact={fact} />
            </dd>
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
    dataTest?: string;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
    primary?: boolean;
}) {
    const href = getActionHref(action);
    const icon = primary ? <PencilLine aria-hidden="true" /> : null;
    const className = primary
        ? 'w-full rounded-xl bg-blue-600 font-semibold shadow-md shadow-blue-200 transition-colors duration-fast hover:bg-blue-700 sm:w-auto'
        : 'group w-full rounded-xl text-blue-700 transition-colors duration-fast hover:bg-blue-50 hover:text-blue-800 sm:w-auto';

    if (href !== null) {
        return (
            <Button
                asChild
                size="lg"
                variant={primary ? 'default' : 'ghost'}
                className={className}
            >
                <Link href={href} data-test={dataTest}>
                    {icon}
                    {action.label}
                    {!primary && (
                        <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform group-hover:translate-x-1"
                        />
                    )}
                </Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            size="lg"
            variant={primary ? 'default' : 'ghost'}
            className={className}
            data-test={dataTest}
            onClick={() => onAction(action)}
        >
            {icon}
            {action.label}
            {!primary && <ArrowRight aria-hidden="true" className="size-4" />}
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
    const hasActions =
        action.primaryAction !== null || action.secondaryAction !== null;

    return (
        <section
            aria-labelledby="dashboard-next-action"
            data-test="dashboard-docket"
        >
            <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_-38px_rgba(30,64,175,0.5)] sm:grid-cols-[9rem_minmax(0,1fr)]">
                <div
                    className={cn(
                        'flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:flex-col sm:justify-center sm:border-r sm:border-b-0 sm:px-4 sm:py-6 sm:text-center xl:py-3',
                        status.className,
                    )}
                >
                    <span className={status.iconContainerClass}>
                        <StatusIcon
                            aria-hidden="true"
                            className="size-7 shrink-0 stroke-[1.8]"
                        />
                    </span>
                    <p className="font-label text-label leading-5 font-bold tracking-[0.11em] uppercase">
                        {action.statusLabel}
                    </p>
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5 xl:py-1">
                        <p className="min-w-0 font-label text-label font-semibold wrap-anywhere">
                            <span className="text-slate-500">
                                {action.category}
                            </span>
                            <span
                                aria-hidden="true"
                                className="px-2 text-slate-400"
                            >
                                /
                            </span>
                            <span className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700">
                                {action.reference}
                            </span>
                        </p>
                        <p className="flex items-center gap-1.5 font-label text-label text-slate-500">
                            <Clock3
                                aria-hidden="true"
                                className="size-3.5 text-blue-600"
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

                    <div className="border-b border-slate-100 px-4 py-5 sm:px-5 sm:py-5 xl:py-2">
                        <h2
                            id="dashboard-next-action"
                            className="max-w-[29ch] text-headline font-bold tracking-[-0.03em] text-balance wrap-anywhere text-slate-950 xl:text-2xl xl:leading-8"
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
                        <div className="grid gap-2.5 bg-slate-50 px-4 py-4 sm:flex sm:flex-wrap sm:items-center sm:px-5 xl:py-1.5">
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
                                    getActionHref={getActionHref}
                                    onAction={onAction}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
