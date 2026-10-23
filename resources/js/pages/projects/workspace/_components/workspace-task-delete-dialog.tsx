import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { UseWorkspaceReturn } from '@/pages/projects/workspace/_hooks/use-workspace';
import type { UseWorkspaceTaskFormReturn } from '@/pages/projects/workspace/_hooks/use-workspace-task-form';

type Props = {
    workspace: UseWorkspaceReturn;
    taskForm: UseWorkspaceTaskFormReturn;
};

export function WorkspaceTaskDeleteDialog({ workspace, taskForm }: Props) {
    const { state, forms, actions } = taskForm;
    const { pendingDelete } = state;
    const { commandBusy, isRefreshing } = workspace.state;
    const isDeleteProcessing = forms.deleteForm.processing;

    return (
        <Dialog
            open={pendingDelete !== null}
            onOpenChange={(open) => {
                if (!open && !isDeleteProcessing) {
                    actions.setPendingDelete(null);
                }
            }}
        >
            <DialogContent
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    const trigger = document.querySelector<HTMLButtonElement>(
                        '[data-test="task-delete"]',
                    );

                    if (trigger && !trigger.disabled) {
                        trigger.focus();
                    } else {
                        document
                            .getElementById('workspace-tasks-title')
                            ?.focus();
                    }
                }}
                closeButtonDisabled={commandBusy || isRefreshing}
            >
                <DialogTitle>Hapus tugas ini?</DialogTitle>
                <DialogDescription>
                    Tugas “{pendingDelete?.title}” dan penanggung jawabnya akan
                    dihapus dari workspace. Riwayat audit tetap dipertahankan.
                </DialogDescription>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            disabled={
                                commandBusy ||
                                isRefreshing ||
                                isDeleteProcessing
                            }
                        >
                            Kembali
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        className="cursor-pointer"
                        disabled={isDeleteProcessing}
                        data-test="task-delete-confirm"
                        onClick={actions.deleteTask}
                    >
                        {isDeleteProcessing && <Spinner aria-hidden="true" />}
                        Ya, hapus task
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
