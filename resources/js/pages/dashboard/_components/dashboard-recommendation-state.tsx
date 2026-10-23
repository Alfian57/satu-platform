import type { InertiaLinkProps } from '@inertiajs/react';
import { Clock3, Compass, RefreshCw, SearchX, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardRegionAction } from '@/pages/dashboard/_components/dashboard-region-action';
import type { DashboardAction, DashboardRecommendationRegion } from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

export function DashboardRecommendationState({
    region,
    getActionHref,
    onAction,
    pendingAffiliation = false,
}: {
    region: Extract<
        DashboardRecommendationRegion,
        {
            state:
                | 'empty'
                | 'error'
                | 'forbidden'
                | 'processing'
                | 'stale'
                | 'unavailable';
        }
    >;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
    pendingAffiliation?: boolean;
}) {
    const Icon =
        region.state === 'error'
            ? RefreshCw
            : region.state === 'forbidden'
              ? pendingAffiliation
                  ? Compass
                  : ShieldAlert
              : region.state === 'processing'
                ? Clock3
                : SearchX;

    return (
        <div
            className="dashboard-recommendation-state mt-4 border-t border-border/50 pt-4"
            data-test={`dashboard-recommendation-${region.state}`}
            role={region.state === 'error' ? 'alert' : 'status'}
        >
            <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                    <Icon
                        aria-hidden="true"
                        className={cn(
                            'size-5',
                            region.state === 'error' && 'text-correction',
                        )}
                    />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-bold text-foreground">
                        {region.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 wrap-anywhere text-muted-foreground">
                        {region.description}
                    </p>
                </div>
            </div>

            {region.action && (
                <DashboardRegionAction
                    action={region.action}
                    getActionHref={getActionHref}
                    onAction={onAction}
                />
            )}
        </div>
    );
}
