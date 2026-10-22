import type { UseWorkspaceReturn } from '@/hooks/use-workspace';
import type { UseWorkspaceTaskFormReturn } from '@/hooks/use-workspace-task-form';
import type { TaskPage, WorkspaceMember } from '@/types';
import { TaskEditorCreate } from './task-editor-create';
import { WorkspaceEmptyState } from './workspace-empty-state';
import { WorkspaceTaskDetailPanel } from './workspace-task-detail-panel';
import { WorkspaceTaskListPanel } from './workspace-task-list-panel';
import { WorkspaceTaskPagination } from './workspace-task-pagination';

type Props = {
    tasks: TaskPage;
    workspace: UseWorkspaceReturn;
    taskForm: UseWorkspaceTaskFormReturn;
    members: WorkspaceMember[];
};

export function WorkspaceTaskBoard({
    tasks,
    workspace,
    taskForm,
    members,
}: Props) {
    const draftConflict =
        taskForm.state.editorMode === 'edit' &&
        taskForm.state.selectedTask !== null &&
        taskForm.forms.editForm.data.expected_revision !== '' &&
        taskForm.forms.editForm.data.expected_revision !==
            taskForm.state.selectedTask.revision;

    const canManage = workspace.state.canWrite && !draftConflict;

    return (
        <section
            aria-labelledby="workspace-tasks-title"
            className="grid min-w-0 gap-5"
        >
            <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 space-y-1">
                    <h2
                        id="workspace-tasks-title"
                        tabIndex={-1}
                        className="text-title font-semibold"
                    >
                        Daftar tugas
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {tasks.meta.total === 0
                            ? 'Belum ada hasil pada filter ini.'
                            : `${tasks.meta.total} tugas dalam konteks workspace ini.`}
                    </p>
                    <p
                        className="max-w-prose text-sm leading-6 text-muted-foreground"
                        data-test="workspace-collaboration-guidance"
                    >
                        Sepakati hasil bersama, bagi bagian pekerjaan dan
                        tentukan siapa yang memeriksa hasil rekan. Percakapan
                        bersifat opsional.
                    </p>
                </div>
                <span className="font-label text-label text-muted-foreground">
                    Halaman {tasks.meta.current_page} dari{' '}
                    {tasks.meta.last_page}
                </span>
            </div>

            {tasks.meta.total === 0 ? (
                <div className="grid min-w-0 gap-6">
                    <WorkspaceEmptyState
                        filtered={workspace.state.hasActiveFilter}
                        onCreate={taskForm.actions.startCreate}
                        onResetFilters={workspace.actions.resetFilters}
                        canCreate={workspace.state.canWrite}
                    />
                    {canManage &&
                        !workspace.state.hasActiveFilter &&
                        taskForm.state.editorMode === 'create' && (
                            <TaskEditorCreate
                                data={taskForm.forms.createForm.data}
                                errors={taskForm.errors.createErrors}
                                processing={
                                    taskForm.forms.createForm.processing
                                }
                                canWrite={workspace.state.canWrite}
                                onFieldChange={(field, value) => {
                                    workspace.actions.markDraft();
                                    taskForm.forms.createForm.setData(
                                        field,
                                        value as never,
                                    );
                                }}
                                onSubmit={taskForm.actions.submitCreate}
                            />
                        )}
                </div>
            ) : (
                <div
                    data-test="workspace-panels"
                    className="grid min-w-0 gap-6 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.4fr)] lg:items-start"
                >
                    <WorkspaceTaskListPanel
                        tasks={tasks}
                        activeSelectedTaskId={taskForm.state.selectedTaskId}
                        onSelectTask={taskForm.actions.selectTask}
                    />

                    <WorkspaceTaskDetailPanel
                        workspace={workspace}
                        taskForm={taskForm}
                        members={members}
                    />
                </div>
            )}

            <WorkspaceTaskPagination
                tasks={tasks}
                isRefreshing={workspace.state.isRefreshing}
                onChangePage={workspace.actions.changePage}
            />
        </section>
    );
}
