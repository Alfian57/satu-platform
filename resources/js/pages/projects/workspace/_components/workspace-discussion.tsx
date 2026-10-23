import { AttachmentItem } from '@/pages/projects/workspace/_components/discussion/attachment-item';
import { DiscussionComposer } from '@/pages/projects/workspace/_components/discussion/discussion-composer';
import { DiscussionHeader } from '@/pages/projects/workspace/_components/discussion/discussion-header';
import { DiscussionTimeline } from '@/pages/projects/workspace/_components/discussion/discussion-timeline';
import { DiscussionUploadProgress } from '@/pages/projects/workspace/_components/discussion/discussion-upload-progress';
import { useWorkspaceDiscussion } from '@/pages/projects/workspace/_hooks/use-workspace-discussion';
import type { DiscussionPage } from '@/types/task';

export { AttachmentItem };

type Props = {
    projectId: number;
    initialPage: DiscussionPage;
    disabled: boolean;
    onForbidden: () => void;
};

export function WorkspaceDiscussion({
    projectId,
    initialPage,
    disabled,
    onForbidden,
}: Props) {
    const { state, forms, errors, actions, refs } = useWorkspaceDiscussion({
        projectId,
        initialPage,
        disabled,
        onForbidden,
    });

    return (
        <section
            aria-labelledby="workspace-discussion-title"
            className="grid gap-5 border-t border-border pt-7"
            data-test="workspace-discussion"
        >
            <DiscussionHeader
                disabled={disabled}
                canLoadOlder={state.canLoadOlder}
                isOlderLoading={forms.olderMessagesForm.processing}
                isCheckLoading={forms.checkForm.processing}
                isDiscussionProcessing={forms.discussionForm.processing}
                isUploading={state.isUploading}
                actionMessage={state.actionMessage}
                actionError={state.actionError}
                onLoadOlder={actions.loadOlderMessages}
                onCheckLatest={actions.checkLatest}
            />

            <DiscussionComposer
                body={state.body}
                selectedFile={state.selectedFile}
                disabled={disabled}
                uncertain={state.uncertain}
                pendingUpload={state.pendingUpload}
                isCheckLoading={forms.checkForm.processing}
                isDiscussionProcessing={forms.discussionForm.processing}
                isUploading={state.isUploading}
                discussionErrors={errors.discussionErrors}
                fileInputRef={refs.fileInput}
                onBodyChange={actions.setBody}
                onFileSelect={actions.selectFile}
                onClearFile={() => actions.setSelectedFile(null)}
                onSubmit={actions.submitDiscussion}
            />

            {state.pendingUpload && (
                <DiscussionUploadProgress
                    pendingUpload={state.pendingUpload}
                    uploadPercentage={
                        forms.uploadForm.progress?.percentage ?? 0
                    }
                    disabled={disabled}
                    uncertain={state.uncertain}
                    isUploading={state.isUploading}
                    isCheckLoading={forms.checkForm.processing}
                    onRetry={actions.retryUpload}
                    onCancelRetry={actions.cancelPendingUploadRetry}
                />
            )}

            <DiscussionTimeline
                projectId={projectId}
                messages={state.messages}
                totalCount={initialPage.meta.total}
                isOlderLoading={forms.olderMessagesForm.processing}
                discussionLoadError={state.discussionLoadError}
                onRetryOlder={actions.loadOlderMessages}
            />
        </section>
    );
}
