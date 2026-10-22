import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardAction } from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

interface DashboardRegionActionProps {
    action: DashboardAction;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
}

export function DashboardRegionAction({
    action,
    getActionHref,
    onAction,
}: DashboardRegionActionProps) {
    const href = getActionHref(action);
    const content = (
        <>
            <Compass
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
            />
            <span className="min-w-0 wrap-anywhere">{action.label}</span>
            <ArrowRight
                aria-hidden="true"
                className="ml-auto size-4 shrink-0"
            />
        </>
    );
    const className =
        'mt-4 h-auto min-h-11 w-full cursor-pointer justify-start rounded-xl border-border bg-white py-3 text-sm font-semibold whitespace-normal text-primary hover:bg-accent';

    if (href !== null) {
        return (
            <Button
                asChild
                variant="outline"
                className={className}
                data-test="dashboard-context-action"
            >
                <Link href={href}>{content}</Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            className={className}
            data-test="dashboard-context-action"
            onClick={() => onAction(action)}
        >
            {content}
        </Button>
    );
}
