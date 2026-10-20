import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    ArrowUpRight,
    Clock3,
    FileCheck2,
    RefreshCw,
    ShieldAlert,
    Sparkle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DashboardAction, DashboardNotice } from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

type Props = {
    notice: DashboardNotice;
    affiliationReview?: boolean;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
};

const noticeStyles: Record<
    DashboardNotice['tone'],
    { icon: LucideIcon; className: string; iconClass: string }
> = {
    error: {
        icon: ShieldAlert,
        className:
            'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
        iconClass: 'text-correction',
    },
    pending: {
        icon: Clock3,
        className:
            'border-pending/30 bg-pending-subtle text-pending-subtle-foreground',
        iconClass: 'text-pending',
    },
    stale: {
        icon: RefreshCw,
        className: 'border-primary/20 bg-accent text-accent-foreground',
        iconClass: 'text-primary',
    },
};

export function DashboardStateNotice({
    notice,
    affiliationReview = false,
    getActionHref,
    onAction,
}: Props) {
    const style = noticeStyles[notice.tone];
    const Icon = style.icon;
    const action = notice.action;
    const actionHref = action ? getActionHref(action) : null;

    if (affiliationReview && notice.tone === 'pending') {
        return (
            <section
                aria-labelledby="dashboard-review-heading"
                aria-live="polite"
                className="dashboard-review-card"
                data-dashboard-notice="pending"
                data-dashboard-affiliation-review
                data-test="dashboard-state-notice"
                role="status"
            >
                <div
                    className="dashboard-review-card__decoration"
                    aria-hidden="true"
                >
                    <Sparkle />
                </div>
                <div className="dashboard-review-card__top">
                    <span className="dashboard-review-card__icon">
                        <FileCheck2 aria-hidden="true" className="size-5" />
                    </span>
                    <p className="dashboard-review-card__eyebrow">
                        Pengajuan tercatat
                    </p>
                    <span className="dashboard-review-card__status">
                        <Clock3 aria-hidden="true" className="size-3.5" />
                        Menunggu tinjauan
                    </span>
                </div>
                <h2 id="dashboard-review-heading">{notice.title}</h2>
                <p className="dashboard-review-card__description">
                    {notice.description}
                </p>
                {notice.timestamp && (
                    <p className="dashboard-review-card__timestamp">
                        <time dateTime={notice.timestampIso}>
                            {notice.timestamp}
                        </time>
                    </p>
                )}
                <div className="dashboard-review-card__footer">
                    <p>Tidak perlu mengajukan ulang.</p>
                    {action && actionHref !== null && (
                        <Button
                            asChild
                            className="dashboard-review-card__action"
                        >
                            <Link href={actionHref}>
                                {action.label}
                                <ArrowUpRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </Link>
                        </Button>
                    )}
                    {action && actionHref === null && (
                        <Button
                            type="button"
                            className="dashboard-review-card__action"
                            onClick={() => onAction(action)}
                        >
                            {action.label}
                            <ArrowUpRight
                                aria-hidden="true"
                                className="size-4"
                            />
                        </Button>
                    )}
                </div>
            </section>
        );
    }

    return (
        <div
            aria-live={notice.tone === 'error' ? undefined : 'polite'}
            className={cn(
                'flex flex-col gap-4 rounded-3xl border p-4.5 shadow-xs sm:flex-row sm:items-center sm:justify-between',
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
                    className="min-h-11 w-full shrink-0 cursor-pointer rounded-full border-current bg-white/70 font-semibold text-current shadow-2xs hover:bg-white sm:w-auto"
                >
                    <Link href={actionHref} className="cursor-pointer">
                        {action.label}
                    </Link>
                </Button>
            )}
            {action && actionHref === null && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 w-full shrink-0 cursor-pointer rounded-full border-current bg-white/70 font-semibold text-current shadow-2xs hover:bg-white sm:w-auto"
                    onClick={() => onAction(action)}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}
