import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    return (
        breadcrumbs.length > 0 && (
            <Breadcrumb className="min-w-0">
                <BreadcrumbList className="flex-nowrap gap-1 overflow-hidden sm:gap-1.5">
                    {breadcrumbs.map((item, index) => {
                        const isLast = index === breadcrumbs.length - 1;

                        return (
                            <Fragment key={item.title}>
                                <BreadcrumbItem className="min-w-0">
                                    {isLast ? (
                                        <BreadcrumbPage
                                            className="truncate font-semibold"
                                            title={item.title}
                                        >
                                            {item.title}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link
                                                href={item.href}
                                                title={item.title}
                                                className="max-w-48 truncate rounded-md py-1 text-muted-foreground hover:text-primary"
                                            >
                                                {item.title}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && (
                                    <BreadcrumbSeparator className="shrink-0 text-muted-foreground/70" />
                                )}
                            </Fragment>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        )
    );
}
