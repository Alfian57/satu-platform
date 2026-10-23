import { UserRound, X } from 'lucide-react';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { WorkspaceMember, WorkspaceTask } from '@/types';
import { firstError, selectClassName } from './workspace-utils';
import type { ErrorMap } from './workspace-utils';

type Props = {
    task: WorkspaceTask;
    members: WorkspaceMember[];
    canManage: boolean;
    assigneeId: number | '';
    isAssignProcessing: boolean;
    isUnassignProcessing: boolean;
    assignErrors: ErrorMap;
    onAssigneeChange: (assigneeId: number | '') => void;
    onAssign: (event: React.FormEvent<HTMLFormElement>) => void;
    onUnassign: (userId: number) => void;
};

export function TaskAssignmentsManager({
    task,
    members,
    canManage,
    assigneeId,
    isAssignProcessing,
    isUnassignProcessing,
    assignErrors,
    onAssigneeChange,
    onAssign,
    onUnassign,
}: Props) {
    return (
        <section
            aria-labelledby="task-assignees-title"
            className="grid gap-4 border-t border-border pt-5"
        >
            <div className="grid gap-1">
                <h4
                    id="task-assignees-title"
                    className="font-label text-label text-muted-foreground"
                >
                    PENANGGUNG JAWAB
                </h4>
                <p className="text-sm text-muted-foreground">
                    Pilih anggota aktif tim untuk memperjelas serah terima.
                </p>
            </div>
            {task.assignments.length > 0 && (
                <ul className="grid gap-2">
                    {task.assignments.map((assignment) => (
                        <li
                            key={assignment.id}
                            className="flex min-w-0 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
                        >
                            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                                <UserRound
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-primary"
                                />
                                <span className="truncate">
                                    {assignment.user.name}
                                </span>
                            </span>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="cursor-pointer text-muted-foreground hover:text-correction-subtle-foreground"
                                disabled={!canManage || isUnassignProcessing}
                                onClick={() => onUnassign(assignment.user.id)}
                                aria-label={`Lepas ${assignment.user.name} dari task`}
                                data-test={`task-unassign-${assignment.user.id}`}
                            >
                                <X aria-hidden="true" />
                                Lepas
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
            <form
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                onSubmit={onAssign}
            >
                <div className="grid gap-2">
                    <label
                        htmlFor="task-assignee"
                        className="text-sm font-semibold"
                    >
                        Tambah anggota
                    </label>
                    <select
                        id="task-assignee"
                        className={selectClassName}
                        value={assigneeId}
                        onChange={(event) =>
                            onAssigneeChange(
                                event.target.value
                                    ? Number(event.target.value)
                                    : '',
                            )
                        }
                        disabled={!canManage || isAssignProcessing}
                        aria-invalid={Boolean(
                            firstError(assignErrors, 'assignee_id'),
                        )}
                    >
                        <option value="">Pilih anggota aktif</option>
                        {members
                            .filter(
                                (member) =>
                                    !task.assignments.some(
                                        (assignment) =>
                                            assignment.user.id === member.id,
                                    ),
                            )
                            .map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name} ({member.role})
                                </option>
                            ))}
                    </select>
                    <InputError
                        message={firstError(assignErrors, 'assignee_id')}
                    />
                </div>
                <Button
                    type="submit"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={
                        !canManage || isAssignProcessing || assigneeId === ''
                    }
                >
                    {isAssignProcessing && <Spinner aria-hidden="true" />}
                    Tugaskan
                </Button>
            </form>
        </section>
    );
}
