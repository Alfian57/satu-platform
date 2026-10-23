import { Head } from '@inertiajs/react';
import { AppPage } from '@/layouts/_components/app-page';
import { ProjectDetailContent } from '@/pages/projects/show/_components/project-detail-content';
import { ProjectDetailSkeleton } from '@/pages/projects/show/_components/project-detail-skeleton';
import { ProjectShowAccessDenied } from '@/pages/projects/show/_components/project-show-access-denied';
import { ProjectShowAlerts } from '@/pages/projects/show/_components/project-show-alerts';
import { ProjectShowContextRail } from '@/pages/projects/show/_components/project-show-context-rail';
import { ProjectShowHeader } from '@/pages/projects/show/_components/project-show-header';
import { ProjectShowNav } from '@/pages/projects/show/_components/project-show-nav';
import { ProjectTransitionDialog } from '@/pages/projects/show/_components/project-transition-dialog';
import type { ProjectShowProps } from '@/pages/projects/show/_components/show-utils';
import { useProjectShow } from '@/pages/projects/show/_hooks/use-project-show';
import { index as projectsIndex } from '@/routes/projects';

export default function ProjectShow({
    project: initialProject,
    team,
    can_edit: canEdit,
    can_transition: canTransition,
    can_workspace: canWorkspace,
}: ProjectShowProps) {
    const {
        project,
        accessDenied,
        pendingAction,
        actionTrigger,
        actionMessage,
        actionError,
        isRefreshing,
        isOwner,
        canRequestJoin,
        normalizedCanEdit,
        allSkills,
        isProcessing,
        transitionReason,
        transitionErrorMessage,
        actions,
    } = useProjectShow({
        initialProject,
        team,
        canEdit,
        canTransition,
        canWorkspace,
    });

    if (accessDenied) {
        return <ProjectShowAccessDenied />;
    }

    return (
        <>
            <Head title={project.title} />
            <AppPage>
                <div
                    data-test="project-detail-root"
                    data-project-status={project.status}
                    aria-busy={isRefreshing}
                    className="grid w-full min-w-0 gap-6"
                >
                    <ProjectShowHeader project={project} isOwner={isOwner} />

                    <div
                        data-test="project-detail-grid"
                        className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                    >
                        <div className="grid min-w-0 gap-6">
                            <ProjectShowNav isRefreshing={isRefreshing} />

                            <ProjectShowAlerts
                                actionMessage={actionMessage}
                                transitionErrorMessage={transitionErrorMessage}
                                actionError={actionError}
                            />

                            {isRefreshing ? (
                                <ProjectDetailSkeleton />
                            ) : (
                                <ProjectDetailContent
                                    project={project}
                                    normalizedCanEdit={normalizedCanEdit}
                                    canTransition={canTransition}
                                    canWorkspace={canWorkspace}
                                    canRequestJoin={canRequestJoin}
                                    isProcessing={isProcessing}
                                    allSkillsCount={allSkills.length}
                                    team={team}
                                    onOpen={() => actions.runTransition('open')}
                                    onDestructiveAction={(action) => {
                                        actions.openDestructiveAction(
                                            action,
                                            document.activeElement instanceof
                                                HTMLElement
                                                ? document.activeElement
                                                : null,
                                        );
                                    }}
                                    onAccessDenied={() =>
                                        actions.setAccessDenied(true)
                                    }
                                />
                            )}
                        </div>
                        <aside aria-label="Konteks proyek" className="min-w-0">
                            <ProjectShowContextRail project={project} />
                        </aside>
                    </div>
                </div>
            </AppPage>

            <ProjectTransitionDialog
                pendingAction={pendingAction}
                isProcessing={isProcessing}
                reason={transitionReason}
                triggerElement={actionTrigger.current}
                onOpenChange={(open) => {
                    if (!open) {
                        actions.closeDestructiveAction();
                    }
                }}
                onReasonChange={actions.setTransitionReason}
                onConfirm={() => {
                    if (pendingAction !== null) {
                        actions.runTransition(pendingAction);
                    }
                }}
            />
        </>
    );
}

ProjectShow.layout = {
    breadcrumbs: [
        {
            title: 'Penemuan proyek',
            href: projectsIndex(),
        },
        {
            title: 'Detail proyek',
        },
    ],
};
