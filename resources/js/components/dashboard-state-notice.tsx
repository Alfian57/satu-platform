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
    { icon: LucideIcon; className: string }
> = {
    error: {
        icon: ShieldAlert,
        className:
            'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
    },
    pending: {
        icon: Clock3,
        className:
            'border-pending/30 bg-pending-subtle text-pending-subtle-foreground',
    },
    stale: {
        icon: RefreshCw,
        className: 'border-primary/25 bg-accent text-accent-foreground',
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
                'flex flex-col gap-4 border-y px-4 py-4 sm:flex-row sm:items-center sm:justify-between',
                style.className,
            )}
            data-dashboard-notice={notice.tone}
            data-test="dashboard-state-notice"
            role={notice.tone === 'error' ? 'alert' : 'status'}
        >
            <div className="flex min-w-0 items-start gap-3">
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <div className="min-w-0">
                    <p className="font-semibold">{notice.title}</p>
                    <p className="mt-1 max-w-[70ch] text-sm leading-6">
                        {notice.description}
                    </p>
                    {notice.timestamp && (
                        <p className="mt-1 font-label text-label">
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
                    size="lg"
                    className="w-full shrink-0 border-current bg-transparent text-current hover:bg-background/40 hover:text-current sm:w-auto"
                >
                    <Link href={actionHref}>{action.label}</Link>
                </Button>
            )}
            {action && actionHref === null && (
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full shrink-0 border-current bg-transparent text-current hover:bg-background/40 hover:text-current sm:w-auto"
                    onClick={() => onAction(action)}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}
