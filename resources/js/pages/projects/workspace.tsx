import { Head } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { AppPage } from '@/components/app-page';
import { TaskLoadingState } from '@/components/projects/workspace/task-loading-state';
import { WorkspaceAccessDenied } from '@/components/projects/workspace/workspace-access-denied';
import { WorkspaceAlerts } from '@/components/projects/workspace/workspace-alerts';
import { WorkspaceContextRail } from '@/components/projects/workspace/workspace-context-rail';
import { WorkspaceDraftBanner } from '@/components/projects/workspace/workspace-draft-banner';
import { WorkspaceFilterBar } from '@/components/projects/workspace/workspace-filter-bar';
import { WorkspaceHeader } from '@/components/projects/workspace/workspace-header';
import { WorkspaceTaskBoard } from '@/components/projects/workspace/workspace-task-board';
import { WorkspaceTaskDeleteDialog } from '@/components/projects/workspace/workspace-task-delete-dialog';
import type { WorkspaceProps } from '@/components/projects/workspace/workspace-utils';
import { WorkspaceDiscussion } from '@/components/projects/workspace-discussion';
import { WorkspaceEvidence } from '@/components/projects/workspace-evidence';
import { useWorkspace } from '@/hooks/use-workspace';
import type { UseWorkspaceTaskFormReturn } from '@/hooks/use-workspace-task-form';
import { useWorkspaceTaskForm } from '@/hooks/use-workspace-task-form';
import { index as projectsIndex } from '@/routes/projects';

export default function ProjectWorkspace({
    project,
    tasks,
    discussion,
    evidence,
    members,
    filters,
    permissions,
}: WorkspaceProps) {
    const taskFormRef = useRef<UseWorkspaceTaskFormReturn | null>(null);

    const workspace = useWorkspace({
        project,
        tasks,
        discussion,
        evidence,
        members,
        filters,
        permissions,
        onTasksFiltered: (nextTasks) => {
            taskFormRef.current?.actions.setSelectedTaskId(
                nextTasks.data[0]?.id ?? null,
            );
        },
    });

    const taskForm = useWorkspaceTaskForm({
        project,
        tasks,
        members,
        workspace,
    });

    useEffect(() => {
        taskFormRef.current = taskForm;
    }, [taskForm]);

    if (workspace.state.accessDenied) {
        return <WorkspaceAccessDenied />;
    }

    return (
        <>
            <Head title={`Ruang kerja · ${project.title}`} />
            <AppPage
                contextRail={
                    <WorkspaceContextRail project={project} tasks={tasks} />
                }
                contextRailLabel="Konteks ruang kerja proyek"
            >
                <div
                    data-test="workspace-root"
                    aria-busy={workspace.state.isRefreshing}
                    className="grid min-w-0 gap-6 motion-reduce:[&_*]:transition-none motion-reduce:[&_svg]:animate-none"
                >
                    <WorkspaceHeader
                        project={project}
                        workspace={workspace}
                        taskForm={taskForm}
                    />

                    <WorkspaceAlerts
                        workspace={workspace}
                        canManageTasks={permissions.can_manage_tasks}
                    />

                    <WorkspaceDraftBanner
                        workspace={workspace}
                        taskForm={taskForm}
                    />

                    <WorkspaceFilterBar
                        workspace={workspace}
                        taskForm={taskForm}
                        filters={filters}
                    />

                    {workspace.state.isRefreshing && <TaskLoadingState />}

                    <WorkspaceTaskBoard
                        tasks={tasks}
                        workspace={workspace}
                        taskForm={taskForm}
                        members={members}
                    />

                    <WorkspaceEvidence
                        projectId={project.id}
                        initialPage={evidence}
                        disabled={!workspace.state.canWrite}
                        onForbidden={() =>
                            workspace.actions.setAccessDenied(true)
                        }
                    />

                    <WorkspaceDiscussion
                        disabled={!workspace.state.canWrite}
                        onForbidden={() =>
                            workspace.actions.setAccessDenied(true)
                        }
                        projectId={project.id}
                        initialPage={discussion}
                    />
                </div>
            </AppPage>

            <WorkspaceTaskDeleteDialog
                workspace={workspace}
                taskForm={taskForm}
            />
        </>
    );
}

ProjectWorkspace.layout = {
    breadcrumbs: [
        {
            title: 'Proyek',
            href: projectsIndex(),
        },
        {
            title: 'Ruang kerja proyek',
        },
    ],
};
