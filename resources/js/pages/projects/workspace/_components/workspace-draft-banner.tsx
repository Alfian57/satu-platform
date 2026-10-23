import type { UseWorkspaceReturn } from '@/pages/projects/workspace/_hooks/use-workspace';
import type { UseWorkspaceTaskFormReturn } from '@/pages/projects/workspace/_hooks/use-workspace-task-form';
import { textAreaClassName } from './workspace-utils';

type Props = {
    workspace: UseWorkspaceReturn;
    taskForm: UseWorkspaceTaskFormReturn;
};

export function WorkspaceDraftBanner({ workspace, taskForm }: Props) {
    const hasDraft = workspace.state.hasDraft;
    const showMissingTaskDraft =
        taskForm.state.editorMode === 'edit' &&
        taskForm.state.selectedTask === null &&
        hasDraft;

    return (
        <div className="grid gap-4">
            <section
                className="grid gap-2 rounded-2xl bg-accent/60 p-4"
                aria-label="Arahan pekerjaan"
            >
                <h2 className="text-base font-semibold">
                    Mulai dari pekerjaan, bukan percakapan
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Pilih Tugas saya untuk melanjutkan tanggung jawabmu. Belum
                    ditugaskan membantu tim membagi pekerjaan. Setelah bekerja,
                    unggah bukti privat di bawah ini.
                </p>
                {hasDraft && (
                    <p role="status" className="text-sm text-primary">
                        Ada catatan tugas yang belum disimpan. Refresh tidak
                        menghapusnya.
                    </p>
                )}
            </section>

            {showMissingTaskDraft && (
                <section
                    className="grid gap-3 rounded-2xl border border-pending/40 bg-pending-subtle p-4"
                    data-test="task-missing-draft"
                >
                    <h2 className="text-base font-semibold">
                        Tugas tidak ada dalam daftar terbaru
                    </h2>
                    <p className="text-sm">
                        Catatan belum disimpan tetap tersedia di bawah. Salin
                        bila dibutuhkan sebelum memilih tugas lain. Data yang
                        hilang tidak dikirim ulang.
                    </p>
                    <label
                        htmlFor="missing-task-draft"
                        className="text-sm font-semibold"
                    >
                        Draft catatan: {taskForm.forms.editForm.data.title}
                    </label>
                    <textarea
                        id="missing-task-draft"
                        readOnly
                        placeholder="Draf catatan tugas..."
                        value={taskForm.forms.editForm.data.description}
                        className={textAreaClassName}
                    />
                </section>
            )}
        </div>
    );
}
