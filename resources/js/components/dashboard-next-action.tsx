import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Building2,
    CalendarDays,
    Check,
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
    {
        icon: LucideIcon;
        className: string;
        iconContainerClass: string;
        labelClass: string;
    }
> = {
    correction: {
        icon: AlertCircle,
        className: 'bg-rose-50/80 text-rose-950 border-rose-200/90',
        iconContainerClass:
            'rounded-2xl border border-rose-200 bg-white p-3 text-rose-600 shadow-2xs',
        labelClass: 'text-rose-800 font-bold',
    },
    pending: {
        icon: Clock3,
        className: 'bg-amber-50/80 text-amber-950 border-amber-200/90',
        iconContainerClass:
            'rounded-2xl border border-amber-200 bg-white p-3 text-amber-600 shadow-2xs',
        labelClass: 'text-amber-800 font-bold',
    },
    neutral: {
        icon: Sparkles,
        className: 'bg-blue-50/70 text-slate-900 border-blue-200/80',
        iconContainerClass:
            'rounded-2xl border border-blue-200 bg-white p-3 text-blue-600 shadow-2xs',
        labelClass: 'text-blue-800 font-bold',
    },
    verified: {
        icon: CircleCheck,
        className: 'bg-emerald-50/70 text-emerald-950 border-emerald-200/80',
        iconContainerClass:
            'rounded-2xl border border-emerald-200 bg-white p-3 text-emerald-600 shadow-2xs',
        labelClass: 'text-emerald-800 font-bold',
    },
};

const factToneStyles = {
    correction: 'text-rose-700',
    default: 'text-slate-800',
    muted: 'text-slate-500',
    pending: 'text-amber-700',
    verified: 'text-emerald-700',
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
                'flex min-w-0 items-center gap-2',
                factToneStyles[fact.tone ?? 'default'],
            )}
        >
            {Icon && (
                <Icon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-slate-400"
                />
            )}
            <span className="min-w-0 wrap-anywhere">
                {isHighlightTone ? (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold shadow-2xs',
                            fact.tone === 'correction' &&
                                'border-rose-200 bg-rose-50 text-rose-800',
                            fact.tone === 'pending' &&
                                'border-amber-200 bg-amber-50 text-amber-800',
                            fact.tone === 'verified' &&
                                'border-emerald-200 bg-emerald-50 text-emerald-800',
                        )}
                    >
                        <Check className="size-3 stroke-[3] text-emerald-600" />
                        {value}
                    </span>
                ) : (
                    <span className="text-sm font-semibold text-slate-800">
                        {value}
                    </span>
                )}
                {fact.supportingValue && (
                    <span className="ml-1.5 text-xs font-normal text-slate-500">
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
        <div className="grid items-center border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60 sm:grid-cols-[11rem_minmax(0,1fr)]">
            <dt className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 font-label text-xs font-bold tracking-wider text-slate-500 uppercase sm:border-r sm:border-b-0 sm:px-5 sm:py-3.5">
                {fact.label}
            </dt>
            <dd className="min-w-0 px-4 py-3 text-sm font-medium text-slate-800 sm:px-5 sm:py-3.5">
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
    const icon = primary ? (
        <Compass aria-hidden="true" className="mr-2 size-4" />
    ) : null;
    const className = primary
        ? 'w-full rounded-xl bg-blue-600 px-6 font-bold text-sm text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all sm:w-auto h-11'
        : 'group w-full rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors sm:w-auto h-11';

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
                            className="ml-1.5 size-4 transition-transform group-hover:translate-x-1"
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
            {!primary && (
                <ArrowRight
                    aria-hidden="true"
                    className="ml-1.5 size-4 transition-transform group-hover:translate-x-1"
                />
            )}
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
            <div className="grid overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs sm:grid-cols-[10rem_minmax(0,1fr)]">
                {/* Status Margin (Left on Desktop, Top on Mobile) */}
                <div
                    className={cn(
                        'flex items-center gap-3 border-b border-slate-200/80 px-4 py-4 sm:flex-col sm:justify-center sm:border-r sm:border-b-0 sm:px-4 sm:py-6 sm:text-center',
                        status.className,
                    )}
                >
                    <span className={status.iconContainerClass}>
                        <StatusIcon
                            aria-hidden="true"
                            className="size-6 shrink-0 stroke-[2]"
                        />
                    </span>
                    <p
                        className={cn(
                            'mt-1 font-label text-xs leading-4 font-bold tracking-wider uppercase',
                            status.labelClass,
                        )}
                    >
                        {action.statusLabel}
                    </p>
                </div>

                {/* Docket Main Body */}
                <div className="min-w-0">
                    {/* Top Reference Bar without DISCOVERY-START */}
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/80 bg-blue-50/80 px-2.5 py-0.5 text-xs font-bold tracking-wider text-blue-700 uppercase">
                                <Sparkles className="size-3 text-blue-600" />
                                {action.category}
                            </span>
                        </div>
                        <p className="flex items-center gap-1.5 font-label text-xs text-slate-500">
                            <Clock3
                                aria-hidden="true"
                                className="size-3.5 text-slate-400"
                            />
                            <span>Dicatat</span>{' '}
                            <time
                                dateTime={action.recordedAtIso}
                                className="font-semibold text-slate-700"
                            >
                                {action.recordedAt}
                            </time>
                        </p>
                    </div>

                    {/* Headline */}
                    <div className="border-b border-slate-100 px-5 py-5">
                        <h2
                            id="dashboard-next-action"
                            className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl"
                        >
                            {action.title}
                        </h2>
                    </div>

                    {/* Ruled Fact Rows */}
                    <dl>
                        {action.facts.map((fact) => (
                            <FactRow key={fact.label} fact={fact} />
                        ))}
                    </dl>

                    {/* Action Footer */}
                    {hasActions && (
                        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
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
                </div>
            </div>
        </section>
    );
}
