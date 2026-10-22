import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types';
import { TaskStatusMark } from './task-status-mark';
import { statusClasses, statusLabels } from './workspace-utils';

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold',
                statusClasses[status],
            )}
        >
            <TaskStatusMark status={status} compact />
            {statusLabels[status]}
        </span>
    );
}
