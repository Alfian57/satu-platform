import { CalendarClock, ChevronRight, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkspaceTask } from '@/types';
import { TaskStatusMark } from './task-status-mark';
import {
    formatDateTime,
    priorityClasses,
    priorityLabels,
} from './workspace-utils';

export function TaskRow({
    task,
    selected,
    onSelect,
}: {
    task: WorkspaceTask;
    selected: boolean;
    onSelect: (task: WorkspaceTask) => void;
}) {
    return (
        <li className="min-w-0 border-b border-border last:border-b-0">
            <button
                type="button"
                className={cn(
                    'grid w-full cursor-pointer gap-3 px-4 py-4 text-left transition-[background-color,box-shadow] duration-fast ease-ledger hover:bg-muted/60 focus-visible:bg-muted/60',
                    selected &&
                        'bg-primary/5 ring-1 ring-primary/40 ring-inset',
                )}
                aria-pressed={selected}
                data-test={`task-row-${task.id}`}
                onClick={() => onSelect(task)}
            >
                <div className="flex min-w-0 items-start gap-3">
                    <TaskStatusMark status={task.status} />
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-label text-label text-muted-foreground">
                                TASK {String(task.id).padStart(4, '0')}
                            </span>
                            <span
                                className={cn(
                                    'font-label text-label',
                                    priorityClasses[task.priority],
                                )}
                            >
                                {priorityLabels[task.priority]}
                            </span>
                        </div>
                        <h3 className="mt-1 text-sm leading-6 font-semibold break-words">
                            {task.title}
                        </h3>
                    </div>
                    <ChevronRight
                        aria-hidden="true"
                        className={cn(
                            'mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-fast',
                            selected && 'translate-x-0.5 text-primary',
                        )}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-10 text-xs text-muted-foreground">
                    <span
                        className={cn(
                            task.is_overdue &&
                                'font-semibold text-correction-subtle-foreground',
                        )}
                    >
                        <CalendarClock
                            aria-hidden="true"
                            className="mr-1 inline size-3.5"
                        />
                        {task.is_overdue
                            ? `Lewat ${formatDateTime(task.due_at)}`
                            : formatDateTime(task.due_at)}
                    </span>
                    <span>
                        <UserRound
                            aria-hidden="true"
                            className="mr-1 inline size-3.5"
                        />
                        {task.assignments.length > 0
                            ? `${task.assignments.length} penanggung jawab`
                            : 'Belum ditugaskan'}
                    </span>
                </div>
            </button>
        </li>
    );
}
