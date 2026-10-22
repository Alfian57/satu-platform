import { CircleAlert, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UseWorkspaceReturn } from '@/hooks/use-workspace';
import type { UseWorkspaceTaskFormReturn } from '@/hooks/use-workspace-task-form';
import type { TaskPriority, WorkspaceMember } from '@/types';
import { TaskAssignmentsManager } from './task-assignments-manager';
import { TaskEditorCreate } from './task-editor-create';
import { TaskEditorEdit } from './task-editor-edit';
import { TaskStatusBadge } from './task-status-badge';
import { TaskStatusTransitions } from './task-status-transitions';
import type { CreateTaskData } from './workspace-utils';

type Props = {
    workspace: UseWorkspaceReturn;
    taskForm: UseWorkspaceTaskFormReturn;
    members: WorkspaceMember[];
};

export function WorkspaceTaskDetailPanel({
    workspace,
    taskForm,
    members,
}: Props) {
    const { state, forms, errors, actions, detailHeadingRef } = taskForm;
    const { selectedTask, editorMode } = state;

    const draftConflict =
        editorMode === 'edit' &&
        selectedTask !== null &&
        forms.editForm.data.expected_revision !== '' &&
        forms.editForm.data.expected_revision !== selectedTask.revision;

    const canManage = workspace.state.canWrite && !draftConflict;

    return (
        <section
            aria-labelledby="workspace-detail-title"
            data-test="workspace-task-detail"
            className="min-w-0 rounded-3xl border border-border bg-background shadow-sm"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
                <div className="min-w-0">
                    <p className="font-label text-label text-muted-foreground">
                        {editorMode === 'create'
                            ? 'TUGAS BARU'
                            : selectedTask
                              ? `TASK ${String(selectedTask.id).padStart(4, '0')}`
                              : 'DETAIL TUGAS'}
                    </p>
                    <h3
                        id="workspace-detail-title"
                        ref={detailHeadingRef}
                        tabIndex={-1}
                        className="mt-1 text-lg font-semibold break-words"
                    >
                        {editorMode === 'create'
                            ? 'Susun pekerjaan yang dapat ditindaklanjuti'
                            : (selectedTask?.title ?? 'Pilih task dari ledger')}
                    </h3>
                </div>
                {editorMode === 'edit' && selectedTask && (
                    <TaskStatusBadge status={selectedTask.status} />
                )}
            </div>

            {draftConflict && (
                <div
                    role="alert"
                    className="m-4 grid gap-3 rounded-2xl border border-pending/40 bg-pending-subtle p-4 text-sm"
                    data-test="task-draft-conflict"
                >
                    <p>
                        Tugas berubah sejak kamu membuka editor. Draft tetap
                        dipertahankan. Periksa judul, catatan, status, dan
                        penanggung jawab terbaru sebelum melanjutkan.
                    </p>
                    <p className="wrap-anywhere whitespace-pre-wrap">
                        Catatan tersimpan:{' '}
                        {selectedTask?.description || 'Belum ada catatan.'}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            if (selectedTask) {
                                actions.selectTask(selectedTask);
                            }
                        }}
                        data-test="task-use-latest"
                    >
                        Gunakan data terbaru
                    </Button>
                </div>
            )}

            {editorMode === 'create' ? (
                <TaskEditorCreate
                    data={forms.createForm.data}
                    errors={errors.createErrors}
                    processing={forms.createForm.processing}
                    canWrite={canManage}
                    onFieldChange={(
                        field: keyof CreateTaskData,
                        value: string | TaskPriority,
                    ) => {
                        workspace.actions.markDraft();
                        forms.createForm.setData(field, value as never);
                    }}
                    onSubmit={actions.submitCreate}
                />
            ) : selectedTask ? (
                <div className="grid gap-6 p-4 sm:p-6">
                    <TaskEditorEdit
                        data={forms.editForm.data}
                        errors={errors.editErrors}
                        processing={forms.editForm.processing}
                        canManage={canManage}
                        updatedAt={selectedTask.updated_at}
                        onFieldChange={(
                            field: keyof CreateTaskData,
                            value: string | TaskPriority,
                        ) => {
                            workspace.actions.markDraft();
                            forms.editForm.setData(field, value as never);
                        }}
                        onSubmit={actions.submitEdit}
                    />

                    <TaskStatusTransitions
                        currentStatus={selectedTask.status}
                        canManage={canManage}
                        processing={forms.transitionForm.processing}
                        transitionErrors={errors.transitionErrors}
                        onTransition={actions.transitionTask}
                    />

                    <TaskAssignmentsManager
                        task={selectedTask}
                        members={members}
                        canManage={canManage}
                        assigneeId={forms.assignForm.data.assignee_id}
                        isAssignProcessing={forms.assignForm.processing}
                        isUnassignProcessing={forms.unassignForm.processing}
                        assignErrors={errors.assignErrors}
                        onAssigneeChange={(assigneeId) => {
                            forms.assignForm.setData('assignee_id', assigneeId);
                        }}
                        onAssign={actions.assignTask}
                        onUnassign={actions.unassignTask}
                    />

                    <section className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            Penghapusan tugas tidak dapat dibatalkan dari
                            halaman ini.
                        </p>
                        <Button
                            type="button"
                            variant="destructive"
                            className="cursor-pointer"
                            disabled={!canManage || forms.deleteForm.processing}
                            onClick={() =>
                                actions.setPendingDelete(selectedTask)
                            }
                            data-test="task-delete"
                        >
                            <Trash2 aria-hidden="true" />
                            Hapus tugas
                        </Button>
                    </section>
                </div>
            ) : (
                <div className="grid gap-3 p-6 text-sm text-muted-foreground">
                    <p>Pilih task untuk melihat detailnya.</p>
                    {workspace.state.canWrite && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-fit cursor-pointer"
                            onClick={actions.startCreate}
                        >
                            <Plus aria-hidden="true" />
                            Buat tugas baru
                        </Button>
                    )}
                </div>
            )}
        </section>
    );
}
