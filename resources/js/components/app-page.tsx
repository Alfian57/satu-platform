import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AppPageWithoutRail = {
    contextRail?: never;
    contextRailLabel?: never;
};

type AppPageWithRail = {
    contextRail: ReactNode;
    contextRailLabel: string;
};

type Props = ComponentProps<'div'> & (AppPageWithoutRail | AppPageWithRail);

export function AppPage({
    children,
    className,
    contextRail,
    contextRailLabel,
    ...props
}: Props) {
    return (
        <div
            data-slot="app-page"
            className={cn(
                'mx-auto grid min-h-0 w-full max-w-[96rem] flex-1 grid-cols-1',
                contextRail &&
                    'xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]',
                className,
            )}
            {...props}
        >
            <div className="min-w-0 px-4 py-6 md:px-6 lg:px-8">{children}</div>
            {contextRail && (
                <aside
                    aria-label={contextRailLabel}
                    className="min-w-0 px-4 pt-0 pb-6 md:px-6 lg:pb-8 xl:py-6 xl:pr-6 xl:pl-0"
                >
                    {contextRail}
                </aside>
            )}
        </div>
    );
}
