import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DashboardAction } from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

export function DashboardNextActionControl({
    action,
    dataTest,
    getActionHref,
    onAction,
    primary = false,
}: {
    action: DashboardAction;
    dataTest: string;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
    primary?: boolean;
}) {
    const href = getActionHref(action);
    const content = (
        <>
            <span className="min-w-0 wrap-anywhere">{action.label}</span>
            <ArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 motion-safe:transition-transform motion-safe:duration-standard motion-safe:group-hover:translate-x-1"
            />
        </>
    );
    const className = cn(
        'group h-auto min-h-11 w-full cursor-pointer rounded-xl px-5 py-3 text-sm font-semibold whitespace-normal motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-standard motion-safe:active:translate-y-0.5 sm:w-auto',
        primary ? 'shadow-sm hover:shadow-md' : 'text-primary',
    );

    if (href !== null) {
        return (
            <Button
                asChild
                variant={primary ? 'default' : 'ghost'}
                className={className}
            >
                <Link href={href} data-test={dataTest}>
                    {content}
                </Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant={primary ? 'default' : 'ghost'}
            className={className}
            data-test={dataTest}
            onClick={() => onAction(action)}
        >
            {content}
        </Button>
    );
}
