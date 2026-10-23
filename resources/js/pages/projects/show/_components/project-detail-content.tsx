import { ProjectActionRail } from '@/pages/projects/show/_components/project-action-rail';
import { ProjectOverviewSection } from '@/pages/projects/show/_components/project-overview-section';
import { ProjectRequirementsSection } from '@/pages/projects/show/_components/project-requirements-section';
import type { TransitionAction } from '@/pages/projects/show/_components/show-utils';
import { TeamFormationPanel } from '@/pages/projects/show/_components/team-formation-panel';
import type { ProjectDetail, TeamFormationState } from '@/types/project';

export function ProjectDetailContent({
    project,
    normalizedCanEdit,
    canTransition,
    canWorkspace,
    canRequestJoin,
    isProcessing,
    allSkillsCount,
    team,
    onOpen,
    onDestructiveAction,
    onAccessDenied,
}: {
    project: ProjectDetail;
    normalizedCanEdit: boolean;
    canTransition: boolean;
    canWorkspace: boolean;
    canRequestJoin: boolean;
    isProcessing: boolean;
    allSkillsCount: number;
    team: TeamFormationState;
    onOpen: () => void;
    onDestructiveAction: (action: TransitionAction) => void;
    onAccessDenied: () => void;
}) {
    return (
        <div
            aria-busy={isProcessing}
            data-test="project-detail-content"
            className="grid min-w-0 gap-6"
        >
            <ProjectActionRail
                project={project}
                canEdit={normalizedCanEdit}
                canTransition={canTransition}
                processing={isProcessing}
                onOpen={onOpen}
                onDestructiveAction={onDestructiveAction}
                canWorkspace={canWorkspace}
                canRequestJoin={canRequestJoin}
            />

            <ProjectOverviewSection project={project} />

            <ProjectRequirementsSection
                roles={project.roles}
                allSkillsCount={allSkillsCount}
            />

            <TeamFormationPanel
                projectId={project.id}
                canWorkspace={canWorkspace}
                roles={project.roles}
                onAccessDenied={onAccessDenied}
                team={team}
            />
        </div>
    );
}
