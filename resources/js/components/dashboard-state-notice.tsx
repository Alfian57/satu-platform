import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { Clock3, RefreshCw, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DashboardAction, DashboardNotice } from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

type Props = {
    notice: DashboardNotice;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
};

const noticeStyles: Record<
    DashboardNotice['tone'],
    { icon: LucideIcon; className: string; iconClass: string }
> = {
    error: {
        icon: ShieldAlert,
        className: 'border-rose-200 bg-rose-50/70 text-rose-950',
        iconClass: 'text-rose-600',
    },
    pending: {
        icon: Clock3,
        className: 'border-amber-200 bg-amber-50/70 text-amber-950',
        iconClass: 'text-amber-600',
    },
    stale: {
        icon: RefreshCw,
        className: 'border-blue-200 bg-blue-50/70 text-blue-950',
        iconClass: 'text-primary',
    },
};

export function DashboardStateNotice({
    notice,
    getActionHref,
    onAction,
}: Props) {
    const style = noticeStyles[notice.tone];
    const Icon = style.icon;
    const action = notice.action;
    const actionHref = action ? getActionHref(action) : null;

    return (
        <div
            aria-live={notice.tone === 'error' ? undefined : 'polite'}
            className={cn(
                'flex flex-col gap-4 rounded-2xl border p-4.5 shadow-xs sm:flex-row sm:items-center sm:justify-between',
                style.className,
            )}
            data-dashboard-notice={notice.tone}
            data-test="dashboard-state-notice"
            role={notice.tone === 'error' ? 'alert' : 'status'}
        >
            <div className="flex min-w-0 items-start gap-3">
                <Icon
                    aria-hidden="true"
                    className={cn('mt-0.5 size-5 shrink-0', style.iconClass)}
                />
                <div className="min-w-0">
                    <p className="text-sm font-bold">{notice.title}</p>
                    <p className="mt-1 max-w-[70ch] text-xs leading-5 opacity-90">
                        {notice.description}
                    </p>
                    {notice.timestamp && (
                        <p className="mt-1 font-label text-[0.65rem] opacity-75">
                            <time dateTime={notice.timestampIso}>
                                {notice.timestamp}
                            </time>
                        </p>
                    )}
                </div>
            </div>
            {action && actionHref !== null && (
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full shrink-0 rounded-xl border-current bg-white/70 font-semibold text-current shadow-2xs hover:bg-white sm:w-auto"
                >
                    <Link href={actionHref}>{action.label}</Link>
                </Button>
            )}
            {action && actionHref === null && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full shrink-0 rounded-xl border-current bg-white/70 font-semibold text-current shadow-2xs hover:bg-white sm:w-auto"
                    onClick={() => onAction(action)}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}
