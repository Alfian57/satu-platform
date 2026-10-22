import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardAction } from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

export function DashboardProjectAction({
    action,
    getActionHref,
    onAction,
}: {
    action: DashboardAction;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
}) {
    const href = getActionHref(action);

    if (href !== null) {
        return (
            <Button
                asChild
                variant="outline"
                size="lg"
                className="h-auto min-h-11 w-full shrink-0 rounded-xl border-border bg-card py-3 font-semibold whitespace-normal text-primary hover:border-primary hover:bg-accent hover:text-primary sm:w-auto"
            >
                <Link href={href}>
                    <span className="min-w-0 wrap-anywhere">
                        {action.label}
                    </span>
                    <ArrowRight
                        aria-hidden="true"
                        className="size-4 shrink-0"
                    />
                </Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-auto min-h-11 w-full shrink-0 rounded-xl border-border bg-card py-3 font-semibold whitespace-normal text-primary hover:border-primary hover:bg-accent hover:text-primary sm:w-auto"
            onClick={() => onAction(action)}
        >
            <span className="min-w-0 wrap-anywhere">{action.label}</span>
            <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
        </Button>
    );
}
