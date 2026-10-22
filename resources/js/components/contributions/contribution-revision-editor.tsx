import { ContributionComposer } from '@/components/contributions/contribution-composer';
import type { UseContributionDetailReturn } from '@/hooks/use-contribution-detail';

export interface ContributionRevisionEditorProps {
    state: UseContributionDetailReturn['state'];
    actions: UseContributionDetailReturn['actions'];
    revisionHeadingRef: React.RefObject<HTMLHeadingElement | null>;
}

export function ContributionRevisionEditor({
    state,
    actions,
    revisionHeadingRef,
}: ContributionRevisionEditorProps) {
    if (!state.revisionProject) {
        return null;
    }

    const status = state.contribution.status;

    return (
        <section
            aria-labelledby="contribution-revision-title"
            className="grid min-w-0 gap-5"
        >
            <div className="grid gap-2">
                <p className="text-xs font-semibold text-primary">
                    {status === 'revision' ? 'Respons revisi' : 'Editor draft'}
                </p>
                <h2
                    id="contribution-revision-title"
                    ref={revisionHeadingRef}
                    tabIndex={-1}
                    className="scroll-mt-24 rounded-lg text-title font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                    {status === 'revision'
                        ? 'Perbaiki catatan, tetap simpan riwayat.'
                        : 'Perbarui draft sebelum dikirim.'}
                </h2>
            </div>
            <ContributionComposer
                mode="revision"
                projects={[state.revisionProject]}
                initialValues={state.revisionInitialValues}
                processing={state.isRevising}
                blocked={state.needsCheck || state.isCheckingLatest}
                errors={state.revisionErrors}
                onDirtyChange={actions.setDraftDirty}
                onSubmit={actions.saveRevision}
                onCancel={actions.cancelRevision}
            />
        </section>
    );
}
