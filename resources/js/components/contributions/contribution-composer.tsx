import { Info } from 'lucide-react';
import { ComposerDeclarationSection } from '@/components/contributions/composer/composer-declaration-section';
import { ComposerErrorSummary } from '@/components/contributions/composer/composer-error-summary';
import { ComposerEvidenceSection } from '@/components/contributions/composer/composer-evidence-section';
import { ComposerFooter } from '@/components/contributions/composer/composer-footer';
import { ComposerNotesSection } from '@/components/contributions/composer/composer-notes-section';
import { ComposerSourceSection } from '@/components/contributions/composer/composer-source-section';
import { useContributionComposer } from '@/hooks/use-contribution-composer';
import type {
    ContributionComposerValues,
    ContributionProjectOption,
} from '@/types/contribution';

export interface ContributionComposerProps {
    mode: 'create' | 'revision';
    projects: ContributionProjectOption[];
    initialValues?: Partial<ContributionComposerValues>;
    processing: boolean;
    blocked?: boolean;
    canLeave?: () => boolean;
    errors: Record<string, unknown>;
    onSubmit: (values: ContributionComposerValues) => void;
    onCancel?: () => void;
    onDirtyChange?: (dirty: boolean) => void;
}

export function ContributionComposer({
    mode,
    projects,
    initialValues,
    processing,
    blocked = false,
    canLeave,
    errors,
    onSubmit,
    onCancel,
    onDirtyChange,
}: ContributionComposerProps) {
    const { state, actions, refs } = useContributionComposer({
        mode,
        projects,
        initialValues,
        processing,
        blocked,
        canLeave,
        errors,
        onSubmit,
        onDirtyChange,
    });

    const canSubmit = state.selectedProject !== null && state.taskId !== '';

    return (
        <form
            onSubmit={actions.submit}
            className="grid min-w-0 gap-6"
            aria-busy={processing}
            data-test={`contribution-${mode}-form`}
        >
            <ComposerErrorSummary
                errorSummaryRef={refs.errorSummary}
                errors={errors}
                hasErrors={state.hasErrors}
            />

            {mode === 'revision' && (
                <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-primary/30 bg-accent/40 px-4 py-3 text-sm leading-6 text-foreground">
                    <Info
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                    />
                    <p>
                        Revisi membuat versi baru. Riwayat versi dan keputusan
                        validasi sebelumnya tetap tersimpan.
                    </p>
                </div>
            )}

            <ComposerSourceSection
                mode={mode}
                projects={projects}
                selectedProject={state.selectedProject}
                projectId={state.projectId}
                taskId={state.taskId}
                processing={processing}
                blocked={blocked}
                taskError={state.taskError}
                onProjectChange={actions.setProjectId}
                onTaskChange={actions.setTaskId}
            />

            <ComposerNotesSection
                mode={mode}
                claim={state.claim}
                summary={state.summary}
                processing={processing}
                blocked={blocked}
                claimError={state.claimError}
                summaryError={state.summaryError}
                onClaimChange={actions.setClaim}
                onSummaryChange={actions.setSummary}
            />

            <ComposerEvidenceSection
                mode={mode}
                selectedProject={state.selectedProject}
                evidence={state.evidence}
                processing={processing}
                blocked={blocked}
                evidenceError={state.evidenceError}
                onToggleEvidence={actions.toggleEvidence}
            />

            <ComposerDeclarationSection
                mode={mode}
                declaration={state.declaration}
                processing={processing}
                blocked={blocked}
                declarationError={state.declarationError}
                onDeclarationChange={actions.setDeclaration}
            />

            <ComposerFooter
                mode={mode}
                processing={processing}
                blocked={blocked}
                canSubmit={canSubmit}
                onCancel={onCancel}
            />
        </form>
    );
}
