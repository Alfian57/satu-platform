import type { InertiaLinkProps } from '@inertiajs/react';
import {
    AlertCircle,
    CircleCheck,
    Clock3,
    Compass,
    Sparkle,
    Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DashboardNextActionControl } from '@/components/dashboard/dashboard-next-action-control';
import { DashboardNextActionFact } from '@/components/dashboard/dashboard-next-action-fact';
import { cn } from '@/lib/utils';
import type {
    DashboardAction,
    DashboardNextAction as DashboardNextActionType,
    DashboardStatusTone,
} from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

type Props = {
    action: DashboardNextActionType;
    referenceLayout?: boolean;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
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

export function DashboardNextAction({
    action,
    referenceLayout = false,
    getActionHref,
    onAction,
}: Props) {
    const status = statusStyles[action.statusTone];
    const StatusIcon = status.icon;

    return (
        <section
            aria-labelledby="dashboard-next-action"
            className="dashboard-docket scroll-mt-24 overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-md"
            data-test="dashboard-docket"
        >
            {referenceLayout && (
                <div className="dashboard-docket__art" aria-hidden="true">
                    <img
                        src="/images/dashboard-review-document.webp"
                        srcSet="/images/dashboard-review-document-256.webp 256w, /images/dashboard-review-document.webp 512w"
                        sizes="192px"
                        width={512}
                        height={512}
                        alt=""
                        loading="lazy"
                        decoding="async"
                    />
                    <Sparkle />
                </div>
            )}
            <div className="dashboard-docket__header flex flex-wrap items-center justify-between gap-3 bg-linear-to-r from-accent/65 to-card px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        <Compass aria-hidden="true" className="size-5" />
                    </span>
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

            <div className="dashboard-docket__body px-5 pt-2 pb-6 sm:px-7 sm:pb-7">
                <h2
                    id="dashboard-next-action"
                    className="max-w-sm scroll-mt-24 text-2xl leading-tight font-bold tracking-tight wrap-anywhere text-foreground sm:text-3xl"
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

                {action.facts.length > 0 && (
                    <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                        {action.facts.map((fact) => (
                            <DashboardNextActionFact
                                key={fact.label}
                                fact={fact}
                            />
                        ))}
                    </dl>
                )}
            </div>

            {(action.primaryAction || action.secondaryAction) && (
                <div className="dashboard-docket__footer flex flex-col gap-2 border-t border-border/60 bg-background/50 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-7">
                    {action.primaryAction && (
                        <DashboardNextActionControl
                            action={action.primaryAction}
                            dataTest="dashboard-primary-action"
                            getActionHref={getActionHref}
                            onAction={onAction}
                            primary
                        />
                    )}
                    {action.secondaryAction && (
                        <DashboardNextActionControl
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
