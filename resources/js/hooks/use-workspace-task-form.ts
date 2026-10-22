import { router, useHttp } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProjectWorkspaceController from '@/actions/App/Http/Controllers/ProjectWorkspaceController';
import {
    dateTimeLocalValue,
    requestFailureMessage,
    submittedDueAt,
} from '@/components/projects/workspace/workspace-utils';
import type {
    AssignmentData,
    AssignmentResponse,
    CreateTaskData,
    DeleteResponse,
    DeleteTaskData,
    ErrorMap,
    TaskResponse,
    TransitionTaskData,
    UpdateTaskData,
} from '@/components/projects/workspace/workspace-utils';
import type { UseWorkspaceReturn } from '@/hooks/use-workspace';
import type {
    TaskPage,
    TaskStatus,
    TaskWorkspaceFilters,
    WorkspaceMember,
    WorkspaceProject,
    WorkspaceTask,
} from '@/types';

export interface UseWorkspaceTaskFormOptions {
    project: WorkspaceProject;
    tasks: TaskPage;
    members: WorkspaceMember[];
    workspace: UseWorkspaceReturn;
    initialSelectedTaskId?: number | null;
}

export function useWorkspaceTaskForm({
    project,
    tasks,
    workspace,
    initialSelectedTaskId,
}: UseWorkspaceTaskFormOptions) {
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
        initialSelectedTaskId ?? tasks.data[0]?.id ?? null,
    );
    const [editorMode, setEditorMode] = useState<'create' | 'edit'>(
        tasks.data.length === 0 ? 'create' : 'edit',
    );
    const [pendingDelete, setPendingDelete] = useState<WorkspaceTask | null>(
        null,
    );
    const detailHeading = useRef<HTMLHeadingElement>(null);
    const focusValidation = useRef(false);

    const createForm = useHttp<CreateTaskData, TaskResponse>({
        title: '',
        description: '',
        priority: 'medium',
        due_at: '',
    });
    const editForm = useHttp<UpdateTaskData, TaskResponse>({
        title: '',
        description: '',
        priority: 'medium',
        due_at: '',
        expected_revision: '',
    });
    const transitionForm = useHttp<TransitionTaskData, TaskResponse>({
        status: 'todo',
        expected_revision: '',
    });
    const assignForm = useHttp<AssignmentData, AssignmentResponse>({
        assignee_id: '',
        expected_revision: '',
    });
    const unassignForm = useHttp<AssignmentData, AssignmentResponse>({
        assignee_id: '',
        expected_revision: '',
    });
    const deleteForm = useHttp<DeleteTaskData, DeleteResponse>({
        expected_revision: '',
    });

    const selectedTask = useMemo(
        () => tasks.data.find((task) => task.id === selectedTaskId) ?? null,
        [selectedTaskId, tasks.data],
    );
    const createErrors = createForm.errors as ErrorMap;
    const editErrors = editForm.errors as ErrorMap;
    const transitionErrors = transitionForm.errors as ErrorMap;
    const assignErrors = assignForm.errors as ErrorMap;

    const canManage = workspace.state.canWrite;

    useEffect(() => {
        if (!workspace.state.commandBusy && focusValidation.current) {
            focusValidation.current = false;
            document
                .querySelector<HTMLElement>(
                    '[data-test="workspace-root"] [aria-invalid="true"]',
                )
                ?.focus();
        }
    }, [
        workspace.state.commandBusy,
        createForm.errors,
        editForm.errors,
        assignForm.errors,
        transitionForm.errors,
        unassignForm.errors,
        deleteForm.errors,
    ]);

    useEffect(() => {
        if (
            editorMode !== 'edit' ||
            selectedTask === null ||
            workspace.refs.draftDirty.current
        ) {
            return;
        }

        editForm.setData({
            title: selectedTask.title,
            description: selectedTask.description ?? '',
            priority: selectedTask.priority,
            due_at: dateTimeLocalValue(selectedTask.due_at),
            expected_revision: selectedTask.revision,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editorMode, selectedTask?.id, selectedTask?.revision]);

    function selectTask(task: WorkspaceTask) {
        if (!workspace.actions.confirmDiscard()) {
            return;
        }

        setSelectedTaskId(task.id);
        setEditorMode('edit');
        workspace.actions.clearActionFeedback();
        editForm.clearErrors();
        editForm.setData({
            title: task.title,
            description: task.description ?? '',
            priority: task.priority,
            due_at: dateTimeLocalValue(task.due_at),
            expected_revision: task.revision,
        });
        requestAnimationFrame(() => detailHeading.current?.focus());
    }

    function startCreate() {
        if (!canManage) {
            return;
        }

        if (!workspace.actions.confirmDiscard()) {
            return;
        }

        setSelectedTaskId(null);
        setEditorMode('create');
        workspace.actions.clearActionFeedback();
        createForm.clearErrors();
        createForm.setData({
            title: '',
            description: '',
            priority: 'medium',
            due_at: '',
        });
    }

    function commandOptions(fallback: string) {
        return {
            onError: () => {
                focusValidation.current = true;
                setPendingDelete(null);
            },
            onHttpException: (response: { status: number }) => {
                setPendingDelete(null);
                workspace.actions.setActionError(
                    requestFailureMessage(response.status),
                );
                workspace.actions.setCheckRequired(true);

                if (response.status === 403 || response.status === 404) {
                    workspace.actions.setAccessDenied(true);
                }

                return false;
            },
            onNetworkError: () => {
                setPendingDelete(null);
                workspace.actions.setActionError(
                    `${fallback} Hasil belum pasti. Periksa status terbaru sebelum mengirim lagi.`,
                );
                workspace.actions.setCheckRequired(true);

                return false;
            },
        };
    }

    function reloadWorkspace(successMessage: string): void {
        workspace.actions.requestRealtimeReconciliation(
            'tasks',
            'command',
            successMessage,
        );
    }

    function submitCreate(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (
            !canManage ||
            workspace.refs.commandLock.current ||
            workspace.refs.checkRequired.current ||
            createForm.processing
        ) {
            return;
        }

        workspace.actions.lockCommand();
        workspace.actions.setCommandBusy(true);
        workspace.actions.clearActionFeedback();
        createForm.transform((data) => ({
            ...data,
            due_at: submittedDueAt(data.due_at),
        }));
        createForm
            .post(ProjectWorkspaceController.store(project.id).url, {
                ...commandOptions('Tugas belum tersimpan.'),
            })
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                workspace.actions.setDraftDirty(false);
                setSelectedTaskId(response.data.id);
                setEditorMode('edit');
                router.visit(
                    ProjectWorkspaceController.show(project.id, {
                        query: { task: response.data.id },
                    }).url,
                    {
                        preserveState: true,
                        preserveScroll: true,
                        onSuccess: (page) => {
                            workspace.actions.setFilterDraft(
                                page.props.filters as TaskWorkspaceFilters,
                            );
                            workspace.actions.setActionMessage(
                                'Tugas baru tersimpan. Tetapkan penanggung jawab agar hasil individual jelas.',
                            );
                        },
                        onHttpException: (failure) => {
                            workspace.actions.reconciliationFailed(
                                failure.status,
                            );

                            return false;
                        },
                        onNetworkError: () => {
                            workspace.actions.reconciliationFailed();

                            return false;
                        },
                    },
                );
            })
            .catch(() => undefined)
            .finally(workspace.actions.unlockCommand);
    }

    function submitEdit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (
            !canManage ||
            workspace.refs.commandLock.current ||
            workspace.refs.checkRequired.current ||
            selectedTask === null ||
            editForm.processing
        ) {
            return;
        }

        workspace.actions.lockCommand();
        workspace.actions.setCommandBusy(true);
        workspace.actions.clearActionFeedback();
        editForm.transform((data) => ({
            ...data,
            due_at: submittedDueAt(data.due_at),
        }));
        editForm
            .patch(
                ProjectWorkspaceController.update({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions('Perubahan tugas belum tersimpan.'),
                },
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                workspace.actions.setDraftDirty(false);
                editForm.setData({
                    ...editForm.data,
                    expected_revision: response.data.revision,
                });
                reloadWorkspace('Detail tugas berhasil diperbarui.');
            })
            .catch(() => undefined)
            .finally(workspace.actions.unlockCommand);
    }

    function transitionTask(status: TaskStatus): void {
        if (
            !canManage ||
            workspace.refs.commandLock.current ||
            workspace.refs.checkRequired.current ||
            selectedTask === null ||
            transitionForm.processing
        ) {
            return;
        }

        workspace.actions.lockCommand();
        workspace.actions.setCommandBusy(true);
        workspace.actions.clearActionFeedback();
        transitionForm.transform((data) => ({
            ...data,
            status,
            expected_revision: selectedTask.revision,
        }));
        transitionForm
            .post(
                ProjectWorkspaceController.transition({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions('Status tugas belum berubah.'),
                },
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                reloadWorkspace('Status tugas berhasil diperbarui.');
            })
            .catch(() => undefined)
            .finally(workspace.actions.unlockCommand);
    }

    function assignTask(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (
            !canManage ||
            workspace.refs.commandLock.current ||
            workspace.refs.checkRequired.current ||
            selectedTask === null ||
            assignForm.processing ||
            assignForm.data.assignee_id === ''
        ) {
            return;
        }

        workspace.actions.lockCommand();
        workspace.actions.setCommandBusy(true);
        workspace.actions.clearActionFeedback();
        assignForm.transform((data) => ({
            ...data,
            expected_revision: selectedTask.revision,
        }));
        assignForm
            .post(
                ProjectWorkspaceController.assign({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions('Penanggung jawab belum ditambahkan.'),
                },
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                assignForm.setData('assignee_id', '');
                reloadWorkspace('Penanggung jawab tugas berhasil diperbarui.');
            })
            .catch(() => undefined)
            .finally(workspace.actions.unlockCommand);
    }

    function unassignTask(userId: number): void {
        if (
            !canManage ||
            workspace.refs.commandLock.current ||
            workspace.refs.checkRequired.current ||
            selectedTask === null ||
            unassignForm.processing
        ) {
            return;
        }

        workspace.actions.lockCommand();
        workspace.actions.setCommandBusy(true);
        workspace.actions.clearActionFeedback();
        unassignForm.transform((data) => ({
            ...data,
            assignee_id: userId,
            expected_revision: selectedTask.revision,
        }));
        unassignForm
            .delete(
                ProjectWorkspaceController.unassign({
                    project: project.id,
                    task: selectedTask.id,
                }).url,
                {
                    ...commandOptions('Penanggung jawab belum dilepas.'),
                },
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                unassignForm.setData('assignee_id', '');
                reloadWorkspace('Penanggung jawab tugas berhasil dilepas.');
            })
            .catch(() => undefined)
            .finally(workspace.actions.unlockCommand);
    }

    function deleteTask(): void {
        if (
            !canManage ||
            workspace.refs.commandLock.current ||
            workspace.refs.checkRequired.current ||
            pendingDelete === null ||
            deleteForm.processing
        ) {
            return;
        }

        const task = pendingDelete;
        workspace.actions.lockCommand();
        workspace.actions.setCommandBusy(true);
        workspace.actions.clearActionFeedback();
        deleteForm.transform(() => ({ expected_revision: task.revision }));
        deleteForm
            .delete(
                ProjectWorkspaceController.destroy({
                    project: project.id,
                    task: task.id,
                }).url,
                {
                    ...commandOptions('Tugas belum dapat dihapus.'),
                },
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                setPendingDelete(null);
                setSelectedTaskId(null);
                setEditorMode('create');
                reloadWorkspace('Tugas berhasil dihapus dari workspace.');
            })
            .catch(() => undefined)
            .finally(workspace.actions.unlockCommand);
    }

    return {
        state: {
            selectedTaskId,
            selectedTask,
            editorMode,
            pendingDelete,
            canManage,
        },
        forms: {
            createForm,
            editForm,
            transitionForm,
            assignForm,
            unassignForm,
            deleteForm,
        },
        errors: {
            createErrors,
            editErrors,
            transitionErrors,
            assignErrors,
        },
        actions: {
            setSelectedTaskId,
            selectTask,
            startCreate,
            setEditorMode,
            setPendingDelete,
            submitCreate,
            submitEdit,
            transitionTask,
            assignTask,
            unassignTask,
            deleteTask,
        },
        refs: {
            detailHeading,
        },
        detailHeadingRef: detailHeading,
    };
}

export type UseWorkspaceTaskFormReturn = ReturnType<
    typeof useWorkspaceTaskForm
>;
