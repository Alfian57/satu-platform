import { CircleDot } from 'lucide-react';
import {
    displayStatus,
    statusClasses,
    statusIcons,
} from '@/components/projects/catalog/catalog-utils';
import type { ProjectStatus } from '@/components/projects/catalog/catalog-utils';
import { cn } from '@/lib/utils';

export function ProjectStatusBadge({ status }: { status: string }) {
    const Icon = statusIcons[status as ProjectStatus] ?? CircleDot;
    const normalizedStatus = status as ProjectStatus;

    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                statusClasses[normalizedStatus] ??
                    'border-border bg-muted text-muted-foreground',
            )}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {displayStatus(status)}
        </span>
    );
}
