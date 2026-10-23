import { FileText, Paperclip, Send, X } from 'lucide-react';
import type { RefObject } from 'react';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
    ACCEPTED_FILE_TYPES,
    firstError,
    formatFileSize,
} from './discussion-utils';
import type { ErrorMap, PendingUpload } from './discussion-utils';

type Props = {
    body: string;
    selectedFile: File | null;
    disabled: boolean;
    uncertain: boolean;
    pendingUpload: PendingUpload | null;
    isCheckLoading: boolean;
    isDiscussionProcessing: boolean;
    isUploading: boolean;
    discussionErrors: ErrorMap;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onBodyChange: (value: string) => void;
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onClearFile: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function DiscussionComposer({
    body,
    selectedFile,
    disabled,
    uncertain,
    pendingUpload,
    isCheckLoading,
    isDiscussionProcessing,
    isUploading,
    discussionErrors,
    fileInputRef,
    onBodyChange,
    onFileSelect,
    onClearFile,
    onSubmit,
}: Props) {
    return (
        <form
            className="grid gap-4 border border-border bg-muted/30 p-4 sm:p-5"
            onSubmit={onSubmit}
            data-test="discussion-composer"
        >
            <div className="grid gap-2">
                <label
                    htmlFor="discussion-body"
                    className="text-sm font-semibold"
                >
                    Tambahkan catatan
                </label>
                <textarea
                    id="discussion-body"
                    data-test="discussion-body"
                    value={body}
                    onChange={(event) => onBodyChange(event.target.value)}
                    className="min-h-28 w-full resize-y border border-input bg-background px-3 py-2 text-base text-foreground transition-[color,background-color,border-color,box-shadow] duration-fast outline-none placeholder:text-muted-foreground hover:border-ring focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    maxLength={5000}
                    placeholder="Tulis hambatan kerja, keputusan, atau langkah berikutnya untuk tim"
                    aria-describedby="discussion-body-help discussion-body-error"
                    aria-invalid={Boolean(firstError(discussionErrors, 'body'))}
                    disabled={
                        disabled ||
                        uncertain ||
                        isDiscussionProcessing ||
                        isUploading
                    }
                />
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    <p id="discussion-body-help">
                        Catatan disimpan di database setelah server
                        mengonfirmasi.
                    </p>
                    <span>{body.length}/5000</span>
                </div>
                <InputError
                    id="discussion-body-error"
                    message={firstError(discussionErrors, 'body')}
                />
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="grid gap-2">
                    <label
                        htmlFor="discussion-file"
                        className="flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-foreground"
                    >
                        <Paperclip aria-hidden="true" className="size-4" />
                        Lampirkan bukti (opsional)
                    </label>
                    <input
                        ref={fileInputRef}
                        id="discussion-file"
                        data-test="discussion-file"
                        type="file"
                        accept={ACCEPTED_FILE_TYPES}
                        onChange={onFileSelect}
                        className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                        disabled={
                            disabled ||
                            uncertain ||
                            isDiscussionProcessing ||
                            isUploading
                        }
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                        PDF, dokumen, spreadsheet, presentasi, gambar, atau
                        text. Maksimal 10 MB.
                    </p>
                    {selectedFile && (
                        <p className="flex items-center gap-2 text-sm text-foreground">
                            <FileText aria-hidden="true" className="size-4" />
                            <span className="min-w-0 truncate">
                                {selectedFile.name} ·{' '}
                                {formatFileSize(selectedFile.size)}
                            </span>
                            <button
                                type="button"
                                className="ml-auto inline-flex size-7 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                onClick={onClearFile}
                                aria-label="Hapus file yang dipilih"
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        </p>
                    )}
                </div>
                <Button
                    type="submit"
                    className="w-full cursor-pointer sm:w-fit"
                    disabled={
                        disabled ||
                        uncertain ||
                        pendingUpload !== null ||
                        isCheckLoading ||
                        isDiscussionProcessing ||
                        isUploading ||
                        body.trim() === ''
                    }
                    data-test="discussion-submit"
                >
                    {isDiscussionProcessing ? (
                        <Spinner aria-hidden="true" />
                    ) : (
                        <Send aria-hidden="true" />
                    )}
                    Simpan catatan
                </Button>
            </div>
        </form>
    );
}
