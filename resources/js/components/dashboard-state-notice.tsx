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
        className: 'border-rose-200 bg-rose-50 text-rose-900',
    },
    pending: {
        icon: Clock3,
        className: 'border-amber-200 bg-amber-50 text-amber-900',
    },
    stale: {
        icon: RefreshCw,
        className: 'border-blue-200 bg-blue-50 text-blue-900',
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
                'flex flex-col gap-4 rounded-2xl border px-4 py-4 shadow-[0_14px_32px_-30px_rgba(30,64,175,0.35)] sm:flex-row sm:items-center sm:justify-between',
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
                    className="w-full shrink-0 rounded-xl border-current bg-white/45 text-current hover:bg-white/75 hover:text-current sm:w-auto"
                >
                    <Link href={actionHref}>{action.label}</Link>
                </Button>
            )}
            {action && actionHref === null && (
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full shrink-0 rounded-xl border-current bg-white/45 text-current hover:bg-white/75 hover:text-current sm:w-auto"
                    onClick={() => onAction(action)}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}
