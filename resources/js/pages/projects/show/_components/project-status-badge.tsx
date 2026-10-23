import { CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    displayStatus,
    statusClasses,
    statusIcons,
} from '@/pages/projects/show/_components/show-utils';
import type { ProjectStatus } from '@/types/project';

export function ProjectStatusBadge({ status }: { status: string }) {
    const normalizedStatus = status as ProjectStatus;
    const Icon = statusIcons[normalizedStatus] ?? CircleDot;

    return (
        <span
            data-test="project-status"
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                statusClasses[normalizedStatus] ??
                    'border-border bg-muted text-muted-foreground',
            )}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {displayStatus(status)}
        </span>
    );
}
