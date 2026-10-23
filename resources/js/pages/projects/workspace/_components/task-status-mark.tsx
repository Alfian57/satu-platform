import { CheckCircle2, CircleAlert, CircleDot, Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types';
import { statusClasses, statusLabels } from './workspace-utils';

export function TaskStatusMark({
    status,
    compact = false,
}: {
    status: TaskStatus;
    compact?: boolean;
}) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-full border',
                compact ? 'size-4 border-0' : 'size-7',
                statusClasses[status],
            )}
            title={statusLabels[status]}
        >
            {status === 'done' && (
                <CheckCircle2
                    aria-hidden="true"
                    className={cn(compact ? 'size-3' : 'size-4')}
                />
            )}
            {status === 'in_progress' && (
                <Clock3
                    aria-hidden="true"
                    className={cn(compact ? 'size-3' : 'size-4')}
                />
            )}
            {status === 'blocked' && (
                <CircleAlert
                    aria-hidden="true"
                    className={cn(compact ? 'size-3' : 'size-4')}
                />
            )}
            {status === 'todo' && (
                <CircleDot
                    aria-hidden="true"
                    className={cn(compact ? 'size-3' : 'size-4')}
                />
            )}
        </span>
    );
}
