import type { TaskPage, WorkspaceTask } from '@/types';
import { TaskRow } from './task-row';

type Props = {
    tasks: TaskPage;
    activeSelectedTaskId: number | null;
    onSelectTask: (task: WorkspaceTask) => void;
};

export function WorkspaceTaskListPanel({
    tasks,
    activeSelectedTaskId,
    onSelectTask,
}: Props) {
    return (
        <section
            aria-labelledby="workspace-list-title"
            className="min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
        >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h3
                    id="workspace-list-title"
                    className="font-label text-label text-muted-foreground"
                >
                    DAFTAR TUGAS
                </h3>
                <span className="text-xs text-muted-foreground">
                    {tasks.meta.from}-{tasks.meta.to}
                </span>
            </div>
            <ul data-test="workspace-task-list" className="min-w-0">
                {tasks.data.map((task) => (
                    <TaskRow
                        key={task.id}
                        task={task}
                        selected={activeSelectedTaskId === task.id}
                        onSelect={onSelectTask}
                    />
                ))}
            </ul>
        </section>
    );
}
