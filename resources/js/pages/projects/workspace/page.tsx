import { Head } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { AppPage } from '@/layouts/_components/app-page';
import { TaskLoadingState } from '@/pages/projects/workspace/_components/task-loading-state';
import { WorkspaceAccessDenied } from '@/pages/projects/workspace/_components/workspace-access-denied';
import { WorkspaceAlerts } from '@/pages/projects/workspace/_components/workspace-alerts';
import { WorkspaceContextRail } from '@/pages/projects/workspace/_components/workspace-context-rail';
import { WorkspaceDiscussion } from '@/pages/projects/workspace/_components/workspace-discussion';
import { WorkspaceDraftBanner } from '@/pages/projects/workspace/_components/workspace-draft-banner';
import { WorkspaceEvidence } from '@/pages/projects/workspace/_components/workspace-evidence';
import { WorkspaceFilterBar } from '@/pages/projects/workspace/_components/workspace-filter-bar';
import { WorkspaceHeader } from '@/pages/projects/workspace/_components/workspace-header';
import { WorkspaceTaskBoard } from '@/pages/projects/workspace/_components/workspace-task-board';
import { WorkspaceTaskDeleteDialog } from '@/pages/projects/workspace/_components/workspace-task-delete-dialog';
import type { WorkspaceProps } from '@/pages/projects/workspace/_components/workspace-utils';
import { useWorkspace } from '@/pages/projects/workspace/_hooks/use-workspace';
import type { UseWorkspaceTaskFormReturn } from '@/pages/projects/workspace/_hooks/use-workspace-task-form';
import { useWorkspaceTaskForm } from '@/pages/projects/workspace/_hooks/use-workspace-task-form';
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
