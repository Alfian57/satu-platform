import { AppPage } from '@/layouts/_components/app-page';
import { EditorContextRail } from '@/pages/projects/_components/editor/editor-context-rail';
import type { ProjectEditorProps } from '@/pages/projects/_components/editor/editor-utils';
import { ProjectEditorAccessDenied } from '@/pages/projects/_components/editor/project-editor-access-denied';
import { ProjectEditorActions } from '@/pages/projects/_components/editor/project-editor-actions';
import { ProjectEditorAlerts } from '@/pages/projects/_components/editor/project-editor-alerts';
import { ProjectEditorBasicInfo } from '@/pages/projects/_components/editor/project-editor-basic-info';
import { ProjectEditorHeader } from '@/pages/projects/_components/editor/project-editor-header';
import { ProjectEditorRoles } from '@/pages/projects/_components/editor/project-editor-roles';
import { ProjectEditorSettings } from '@/pages/projects/_components/editor/project-editor-settings';
import { useProjectEditor } from '@/pages/projects/_hooks/use-project-editor';

export function ProjectEditor({
    mode,
    institution,
    project,
}: ProjectEditorProps) {
    const { state, actions, errorSummaryRef, actionErrorRef } =
        useProjectEditor({
            mode,
            institution,
            project,
        });

    if (state.accessDenied) {
        return <ProjectEditorAccessDenied institutionId={institution.id} />;
    }

    return (
        <AppPage>
            <div
                data-test="project-editor-root"
                className="grid w-full min-w-0 gap-6"
            >
                <ProjectEditorHeader
                    mode={mode}
                    institutionName={institution.name}
                />

                <div
                    data-test="project-editor-grid"
                    className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                >
                    <div className="grid min-w-0 gap-6">
                        <ProjectEditorAlerts
                            actionError={state.actionError}
                            hasErrors={state.hasErrors}
                            errors={state.errors}
                            openingErrors={state.openingErrors}
                            savedDraft={state.savedDraft}
                            openingProcessing={state.openingProcessing}
                            institutionId={institution.id}
                            actionErrorRef={actionErrorRef}
                            errorSummaryRef={errorSummaryRef}
                        />

                        <form
                            data-test="project-editor-form"
                            aria-busy={state.isProcessing}
                            className="grid min-w-0 gap-6"
                            onSubmit={actions.submit}
                        >
                            <ProjectEditorBasicInfo
                                title={state.data.title}
                                description={state.data.description}
                                errors={state.errors}
                                onTitleChange={actions.setTitle}
                                onDescriptionChange={actions.setDescription}
                            />

                            <ProjectEditorSettings
                                capacity={state.data.capacity}
                                deadline={state.data.deadline}
                                visibility={state.data.visibility}
                                errors={state.errors}
                                onCapacityChange={actions.setCapacity}
                                onDeadlineChange={actions.setDeadline}
                                onVisibilityChange={actions.setVisibility}
                            />

                            <ProjectEditorRoles
                                roles={state.data.roles}
                                roleCapacity={state.roleCapacity}
                                projectCapacity={state.data.capacity}
                                errors={state.errors}
                                isProcessing={state.isProcessing}
                                onAddRole={actions.addRole}
                                onRemoveRole={actions.removeRole}
                                onUpdateRole={actions.updateRole}
                                onUpdateRoleSkill={actions.updateRoleSkill}
                                onRemoveRoleSkill={actions.removeRoleSkill}
                            />

                            <ProjectEditorActions
                                mode={mode}
                                isProcessing={state.isProcessing}
                                uncertainSave={state.uncertainSave}
                                savedDraft={state.savedDraft}
                                submitIntent={state.submitIntent}
                                formProcessing={state.formProcessing}
                                openingProcessing={state.openingProcessing}
                                onSetSubmitIntent={actions.setSubmitIntent}
                            />
                        </form>
                    </div>

                    <aside
                        aria-label="Konteks editor proyek"
                        className="min-w-0"
                    >
                        <EditorContextRail
                            institution={institution}
                            mode={mode}
                            project={project}
                            roleCapacity={state.roleCapacity}
                            totalCapacity={state.data.capacity}
                        />
                    </aside>
                </div>
            </div>
        </AppPage>
    );
}
