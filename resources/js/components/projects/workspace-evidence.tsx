import { EvidenceForm } from '@/components/projects/evidence/evidence-form';
import { EvidenceGallery } from '@/components/projects/evidence/evidence-gallery';
import { EvidenceHeader } from '@/components/projects/evidence/evidence-header';
import { EvidencePagination } from '@/components/projects/evidence/evidence-pagination';
import { useWorkspaceEvidence } from '@/hooks/use-workspace-evidence';
import type { WorkspaceEvidencePage } from '@/types/task';

type Props = {
    projectId: number;
    initialPage: WorkspaceEvidencePage;
    disabled: boolean;
    onForbidden: () => void;
};

export function WorkspaceEvidence({
    projectId,
    initialPage,
    disabled,
    onForbidden,
}: Props) {
    const { state, forms, actions, refs } = useWorkspaceEvidence({
        projectId,
        initialPage,
        disabled,
        onForbidden,
    });

    return (
        <section
            className="grid min-w-0 gap-5 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6"
            aria-labelledby="workspace-evidence-title"
            data-test="workspace-evidence"
        >
            <EvidenceHeader
                headingRef={refs.heading}
                disabled={disabled}
                uncertain={state.uncertain}
                isUploadProcessing={forms.upload.processing}
                isReadProcessing={forms.read.processing}
                onRefresh={() => actions.readPage(1, state.uncertain)}
            />

            <EvidenceForm
                fileInputRef={refs.fileInput}
                file={state.file}
                disabled={disabled}
                uncertain={state.uncertain}
                isUploadProcessing={forms.upload.processing}
                isReadProcessing={forms.read.processing}
                uploadPercentage={forms.upload.progress?.percentage ?? 0}
                uploadError={
                    typeof forms.upload.errors.file === 'string'
                        ? forms.upload.errors.file
                        : undefined
                }
                onFileChange={actions.setFile}
                onSubmit={actions.submit}
            />

            {state.notice && (
                <p
                    role="status"
                    className="text-sm leading-6 text-primary"
                    data-test="evidence-success"
                >
                    {state.notice}
                </p>
            )}

            {state.error && (
                <p
                    role="alert"
                    className="text-sm leading-6 text-correction"
                    data-test="evidence-error"
                >
                    {state.error}
                </p>
            )}

            <EvidenceGallery
                projectId={projectId}
                attachments={state.page.data}
                isReadProcessing={forms.read.processing}
            />

            <EvidencePagination
                currentPage={state.page.meta.current_page}
                lastPage={state.page.meta.last_page}
                disabled={disabled}
                isReadProcessing={forms.read.processing}
                isUploadProcessing={forms.upload.processing}
                onPageChange={(page) => actions.readPage(page)}
            />
        </section>
    );
}
