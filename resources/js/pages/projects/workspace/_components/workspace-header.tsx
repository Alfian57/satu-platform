import { Link } from '@inertiajs/react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WorkspaceRealtimeStatus } from '@/pages/projects/workspace/_components/workspace-realtime-status';
import type { UseWorkspaceReturn } from '@/pages/projects/workspace/_hooks/use-workspace';
import type { UseWorkspaceTaskFormReturn } from '@/pages/projects/workspace/_hooks/use-workspace-task-form';
import { show as projectShow } from '@/routes/projects';
import type { WorkspaceProject } from '@/types';

type Props = {
    project: WorkspaceProject;
    workspace: UseWorkspaceReturn;
    taskForm: UseWorkspaceTaskFormReturn;
};

export function WorkspaceHeader({ project, workspace, taskForm }: Props) {
    const draftConflict =
        taskForm.state.editorMode === 'edit' &&
        taskForm.state.selectedTask !== null &&
        taskForm.forms.editForm.data.expected_revision !== '' &&
        taskForm.forms.editForm.data.expected_revision !==
            taskForm.state.selectedTask.revision;

    const canManage = workspace.state.canWrite && !draftConflict;

    return (
        <header className="grid gap-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-8">
            <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="font-label text-label text-muted-foreground">
                        RUANG KERJA PROYEK {String(project.id).padStart(4, '0')}
                    </span>
                    <span className="border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">
                        Ruang kerja tim
                    </span>
                    <WorkspaceRealtimeStatus
                        status={workspace.realtime.connectionState}
                        presenceMembers={workspace.realtime.presenceMembers}
                        onRetry={workspace.realtime.retryConnection}
                    />
                </div>
                <h1 className="max-w-[28ch] text-headline font-bold text-balance break-words">
                    {project.title}
                </h1>
                <p className="max-w-[70ch] text-body leading-7 text-muted-foreground">
                    Temukan tanggung jawabmu, kerjakan hasil yang jelas, lalu
                    simpan bukti privat. Diskusi tersedia bila dibutuhkan.
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Button asChild variant="ghost" className="cursor-pointer">
                    <Link href={projectShow(project.id)}>
                        Kembali ke detail proyek
                    </Link>
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={
                        workspace.state.isRefreshing ||
                        workspace.state.commandBusy
                    }
                    onClick={() => {
                        workspace.actions.clearActionFeedback();
                        workspace.actions.requestWorkspaceReconciliation(
                            'manual',
                        );
                    }}
                    data-test="workspace-refresh"
                >
                    <RefreshCw
                        aria-hidden="true"
                        className={cn(
                            workspace.state.isRefreshing && 'animate-spin',
                        )}
                    />
                    Muat ulang
                </Button>
                {canManage && (
                    <Button
                        type="button"
                        className="cursor-pointer"
                        onClick={taskForm.actions.startCreate}
                        data-test="workspace-new-task"
                    >
                        <Plus aria-hidden="true" />
                        Tugas baru
                    </Button>
                )}
            </div>
        </header>
    );
}
