import { useHttp } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Download,
    FileText,
    Image as ImageIcon,
    Paperclip,
    RefreshCw,
    Send,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    download as attachmentDownload,
    preview as attachmentPreview,
    store as attachmentStore,
} from '@/actions/App/Http/Controllers/ProjectAttachmentController';
import {
    index as discussionIndex,
    store as discussionStore,
} from '@/actions/App/Http/Controllers/ProjectDiscussionController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import type {
    DiscussionPage,
    WorkspaceAttachment,
    WorkspaceDiscussion,
    WorkspaceAttachmentPurpose,
} from '@/types/task';

type DiscussionFormData = {
    body: string;
};

type UploadFormData = {
    file: File | null;
    message_id: number | null;
    purpose: WorkspaceAttachmentPurpose;
};

type MessageResponse = {
    data: WorkspaceDiscussion;
};

type AttachmentResponse = {
    data: WorkspaceAttachment;
};

type DiscussionQueryData = Record<string, never>;

type PendingUpload = {
    file: File;
    messageId: number;
    status: 'uploading' | 'failed';
    error: string | null;
};

type ErrorMap = Record<string, unknown>;

type Props = {
    projectId: number;
    initialPage: DiscussionPage;
    disabled: boolean;
    onForbidden: () => void;
};

const ACCEPTED_FILE_TYPES =
    '.csv,.doc,.docx,.jpg,.jpeg,.pdf,.png,.ppt,.pptx,.txt,.webp,.xls,.xlsx';

function firstError(errors: ErrorMap, field: string): string | undefined {
    const value = errors[field];

    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : undefined;
    }

    return typeof value === 'string' ? value : undefined;
}

function formatDateTime(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Waktu tidak tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function formatFileSize(sizeBytes: number): string {
    if (sizeBytes < 1024) {
        return `${sizeBytes} B`;
    }

    if (sizeBytes < 1024 * 1024) {
        return `${Math.round(sizeBytes / 1024)} KB`;
    }

    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function AttachmentItem({
    attachment,
    projectId,
}: {
    attachment: WorkspaceAttachment;
    projectId: number;
}) {
    const previewUrl = attachmentPreview({
        project: projectId,
        attachment: attachment.id,
    }).url;
    const downloadUrl = attachmentDownload({
        project: projectId,
        attachment: attachment.id,
    }).url;
    const isImage = attachment.mime_type.startsWith('image/');

    return (
        <li
            className="grid gap-3 border-t border-border pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            data-test={`discussion-attachment-${attachment.id}`}
        >
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center border border-border bg-muted text-primary">
                    {isImage ? (
                        <ImageIcon aria-hidden="true" className="size-4" />
                    ) : (
                        <FileText aria-hidden="true" className="size-4" />
                    )}
                </span>
                <div className="min-w-0">
                    {isImage && (
                        <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mb-2 block w-fit cursor-pointer overflow-hidden border border-border bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            aria-label={`Buka pratinjau ${attachment.original_name}`}
                        >
                            <img
                                src={previewUrl}
                                alt={`Pratinjau ${attachment.original_name}`}
                                loading="lazy"
                                className="max-h-40 max-w-full object-contain sm:max-w-56"
                            />
                        </a>
                    )}
                    <p className="truncate text-sm font-semibold">
                        {attachment.original_name}
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                        {attachment.purpose === 'evidence'
                            ? 'Bukti privat'
                            : 'Lampiran'}{' '}
                        · {formatFileSize(attachment.size_bytes)} · diunggah
                        oleh {attachment.uploaded_by.name} ·{' '}
                        {formatDateTime(attachment.created_at)}
                    </p>
                </div>
            </div>
            <a
                href={downloadUrl}
                download={attachment.original_name}
                className="inline-flex h-control-sm w-fit cursor-pointer items-center gap-2 rounded-sm border border-input px-3 text-sm font-semibold text-foreground transition-colors duration-fast hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
                <Download aria-hidden="true" className="size-4" />
                Unduh
            </a>
        </li>
    );
}

function DiscussionMessage({
    message,
    projectId,
}: {
    message: WorkspaceDiscussion;
    projectId: number;
}) {
    return (
        <li data-test={`discussion-message-${message.id}`}>
            <article className="grid gap-3 border-b border-border pb-5">
                <header className="flex items-start gap-3">
                    <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-xs font-bold text-primary"
                    >
                        {initials(message.author.name)}
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <h3 className="text-sm font-semibold">
                                {message.author.name}
                            </h3>
                            <p className="font-label text-label text-muted-foreground">
                                {formatDateTime(message.created_at)}
                            </p>
                            {message.is_edited && (
                                <span className="text-xs text-muted-foreground">
                                    · diedit
                                </span>
                            )}
                        </div>
                        <p className="font-label text-label text-muted-foreground">
                            Catatan tim
                        </p>
                    </div>
                </header>
                <p className="pl-12 text-sm leading-6 break-words whitespace-pre-wrap text-foreground">
                    {message.body}
                </p>
                {message.attachments.length > 0 && (
                    <ul className="grid gap-3 pl-12" aria-label="Bukti pesan">
                        {message.attachments.map((attachment) => (
                            <AttachmentItem
                                key={attachment.id}
                                attachment={attachment}
                                projectId={projectId}
                            />
                        ))}
                    </ul>
                )}
            </article>
        </li>
    );
}

function DiscussionSkeleton() {
    return (
        <div
            className="grid gap-4 border-b border-border py-4"
            aria-hidden="true"
        >
            <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="grid flex-1 gap-2">
                    <Skeleton className="h-3 w-2/5" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
            <Skeleton className="ml-12 h-12 w-[calc(100%-3rem)]" />
        </div>
    );
}

export function WorkspaceDiscussion({
    projectId,
    initialPage,
    disabled,
    onForbidden,
}: Props) {
    const [uncertain, setUncertain] = useState(false);
    const commandLock = useRef(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const focusValidation = useRef<'body' | 'upload' | null>(null);
    const [messages, setMessages] = useState(initialPage.data);
    const [currentPage, setCurrentPage] = useState(
        initialPage.meta.current_page,
    );
    const [lastPage, setLastPage] = useState(initialPage.meta.last_page);
    const [body, setBody] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(
        null,
    );
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [discussionLoadError, setDiscussionLoadError] = useState<
        string | null
    >(null);

    useEffect(() => {
        let isActive = true;

        queueMicrotask(() => {
            if (!isActive) {
                return;
            }

            setMessages(initialPage.data);
            setCurrentPage(initialPage.meta.current_page);
            setLastPage(initialPage.meta.last_page);
        });

        return () => {
            isActive = false;
        };
    }, [initialPage]);

    const discussionForm = useHttp<DiscussionFormData, MessageResponse>({
        body: '',
    });
    const olderMessagesForm = useHttp<DiscussionQueryData, DiscussionPage>({});
    const checkForm = useHttp<DiscussionQueryData, DiscussionPage>({});
    const uploadForm = useHttp<UploadFormData, AttachmentResponse>({
        file: null,
        message_id: null,
        purpose: 'evidence',
    });

    useEffect(() => {
        if (
            !discussionForm.processing &&
            !uploadForm.processing &&
            !disabled &&
            focusValidation.current
        ) {
            if (focusValidation.current === 'body') {
                document.getElementById('discussion-body')?.focus();
            } else {
                document
                    .querySelector<HTMLElement>(
                        '[data-test="discussion-upload-retry"]',
                    )
                    ?.focus();
            }

            focusValidation.current = null;
        }
    }, [
        discussionForm.processing,
        discussionForm.errors,
        uploadForm.processing,
        uploadForm.errors,
        pendingUpload?.status,
        disabled,
    ]);

    const discussionErrors = discussionForm.errors as ErrorMap;
    const isUploading =
        uploadForm.processing || pendingUpload?.status === 'uploading';
    const canLoadOlder = currentPage < lastPage;

    function mergeMessages(nextMessages: WorkspaceDiscussion[]): void {
        setMessages((currentMessages) => {
            const byId = new Map(
                currentMessages.map((message) => [message.id, message]),
            );

            nextMessages.forEach((message) => {
                byId.set(message.id, message);
            });

            return Array.from(byId.values()).sort((left, right) => {
                const timeDifference =
                    new Date(right.created_at).getTime() -
                    new Date(left.created_at).getTime();

                return timeDifference === 0
                    ? right.id - left.id
                    : timeDifference;
            });
        });
    }

    function uploadFailure(message: string): void {
        setPendingUpload((current) =>
            current === null
                ? current
                : { ...current, status: 'failed', error: message },
        );
        setActionError(message);
    }

    function uploadAttachment(
        messageId: number,
        file: File,
    ): Promise<void> | undefined {
        if (disabled || uncertain || commandLock.current) {
            return;
        }

        commandLock.current = true;
        setActionMessage(null);
        setActionError(null);
        setPendingUpload({
            file,
            messageId,
            status: 'uploading',
            error: null,
        });
        uploadForm.transform(() => ({
            file,
            message_id: messageId,
            purpose: 'evidence',
        }));

        return uploadForm
            .post(attachmentStore(projectId).url, {
                onError: (errors) => {
                    focusValidation.current = 'upload';
                    uploadFailure(
                        firstError(errors as ErrorMap, 'file') ??
                            'Bukti belum tersimpan. Periksa file lalu coba lagi.',
                    );
                },
                onHttpException: (response: { status: number }) => {
                    if (response.status === 403 || response.status === 404) {
                        onForbidden();
                    }

                    setUncertain(true);
                    uploadFailure(
                        response.status === 403
                            ? 'Anda tidak lagi memiliki akses untuk mengunggah bukti pada workspace ini.'
                            : 'Bukti belum tersimpan. Coba lagi setelah memeriksa koneksi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setUncertain(true);
                    uploadFailure(
                        'Catatan sudah tersimpan, tetapi hasil unggah belum pasti. Periksa diskusi terbaru sebelum mengunggah lagi.',
                    );

                    return false;
                },
            })
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                setMessages((currentMessages) =>
                    currentMessages.map((message) =>
                        message.id === messageId
                            ? {
                                  ...message,
                                  attachments: [
                                      ...message.attachments,
                                      response.data,
                                  ],
                              }
                            : message,
                    ),
                );
                setPendingUpload(null);
                setActionMessage('Bukti berhasil dilampirkan ke diskusi.');
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    function submitDiscussion(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (
            disabled ||
            uncertain ||
            commandLock.current ||
            pendingUpload !== null ||
            discussionForm.processing ||
            isUploading ||
            body.trim() === ''
        ) {
            return;
        }

        const file = selectedFile;
        commandLock.current = true;
        setActionMessage(null);
        setActionError(null);
        discussionForm.transform(() => ({ body: body.trim() }));
        discussionForm
            .post(discussionStore(projectId).url, {
                onError: () => {
                    focusValidation.current = 'body';
                },
                onHttpException: (response: { status: number }) => {
                    if (response.status === 403 || response.status === 404) {
                        onForbidden();
                    }

                    setUncertain(true);
                    setActionError(
                        response.status === 403
                            ? 'Anda tidak lagi memiliki akses untuk menulis di workspace ini.'
                            : 'Hasil penyimpanan catatan belum pasti. Periksa diskusi terbaru sebelum mengirim lagi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setUncertain(true);
                    setActionError(
                        'Hasil penyimpanan catatan belum pasti. Draft tetap ada. Periksa diskusi terbaru sebelum mengirim lagi.',
                    );

                    return false;
                },
            })
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                mergeMessages([response.data]);
                setBody('');
                setSelectedFile(null);

                if (fileInput.current) {
                    fileInput.current.value = '';
                }

                if (file !== null) {
                    commandLock.current = false;
                    setActionMessage(
                        'Catatan tersimpan. Bukti sedang diunggah dan belum dianggap selesai sampai server mengonfirmasinya.',
                    );

                    return uploadAttachment(response.data.id, file);
                }

                setActionMessage('Catatan berhasil ditambahkan ke diskusi.');
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    function loadOlderMessages(): void {
        if (disabled || olderMessagesForm.processing || !canLoadOlder) {
            return;
        }

        setDiscussionLoadError(null);
        const nextPage = currentPage + 1;

        olderMessagesForm
            .get(
                discussionIndex(projectId, {
                    query: {
                        page: nextPage,
                        per_page: initialPage.meta.per_page,
                    },
                }).url,
                {
                    onHttpException: (response: { status: number }) => {
                        if (
                            response.status === 403 ||
                            response.status === 404
                        ) {
                            onForbidden();
                        }

                        setDiscussionLoadError(
                            response.status === 403
                                ? 'Diskusi tidak lagi dapat diakses dengan permission saat ini.'
                                : 'Diskusi sebelumnya belum dapat dimuat. Coba lagi.',
                        );

                        return false;
                    },
                    onNetworkError: () => {
                        setDiscussionLoadError(
                            'Diskusi sebelumnya belum dapat dimuat. Periksa koneksi lalu coba lagi.',
                        );

                        return false;
                    },
                },
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                mergeMessages(response.data);
                setCurrentPage(response.meta.current_page);
                setLastPage(response.meta.last_page);
            })
            .catch(() => undefined);
    }

    function selectFile(event: React.ChangeEvent<HTMLInputElement>): void {
        const file = event.target.files?.[0] ?? null;
        setSelectedFile(file);
        setActionError(null);
    }

    function retryUpload(): void {
        if (disabled || uncertain || pendingUpload === null || isUploading) {
            return;
        }

        uploadAttachment(pendingUpload.messageId, pendingUpload.file);
    }

    function checkLatest(): void {
        if (disabled || checkForm.processing || commandLock.current) {
            return;
        }

        checkForm
            .get(discussionIndex(projectId).url, {
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        onForbidden();
                    }

                    setActionError(
                        'Diskusi terbaru belum dapat diperiksa. Pengiriman tetap ditahan.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setActionError(
                        'Koneksi belum pulih. Periksa diskusi terbaru saat tersambung.',
                    );

                    return false;
                },
            })
            .then((response) => {
                setMessages(response.data);
                setCurrentPage(response.meta.current_page);
                setLastPage(response.meta.last_page);
                setUncertain(false);
                setActionError(null);
                setActionMessage(
                    'Data terbaru sudah dibaca. Periksa catatan dan lampirannya sebelum mengirim lagi. Tidak ada pengiriman ulang otomatis.',
                );
            })
            .catch(() => undefined);
    }

    return (
        <section
            aria-labelledby="workspace-discussion-title"
            className="grid gap-5 border-t border-border pt-7"
            data-test="workspace-discussion"
        >
            <header className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-5">
                <div className="grid gap-2">
                    <p className="font-label text-label text-muted-foreground">
                        DISKUSI OPSIONAL
                    </p>
                    <h2
                        id="workspace-discussion-title"
                        className="text-title font-semibold"
                    >
                        Diskusi tim (opsional)
                    </h2>
                    <p className="max-w-[70ch] text-sm leading-6 text-muted-foreground">
                        Gunakan untuk pertanyaan, hambatan, atau serah terima.
                        Tidak perlu berbicara di sini untuk menyelesaikan tugas
                        atau mengunggah bukti privat.
                    </p>
                </div>
                {canLoadOlder && (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-fit cursor-pointer"
                        disabled={olderMessagesForm.processing}
                        onClick={loadOlderMessages}
                        data-test="discussion-load-older"
                    >
                        {olderMessagesForm.processing ? (
                            <Spinner aria-hidden="true" />
                        ) : (
                            <RefreshCw aria-hidden="true" />
                        )}
                        Muat diskusi sebelumnya
                    </Button>
                )}
            </header>

            <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={checkLatest}
                disabled={
                    disabled ||
                    isUploading ||
                    discussionForm.processing ||
                    checkForm.processing
                }
                data-test="discussion-check-latest"
            >
                <RefreshCw aria-hidden="true" />
                {checkForm.processing
                    ? 'Memeriksa diskusi...'
                    : 'Periksa diskusi terbaru'}
            </Button>

            <div className="grid gap-3" aria-live="polite">
                {actionMessage && (
                    <p
                        className="flex items-start gap-2 border border-verified/30 bg-verified-subtle px-3 py-2 text-sm text-verified-subtle-foreground"
                        data-test="discussion-action-success"
                        role="status"
                    >
                        <CheckCircle2
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        <span>{actionMessage}</span>
                    </p>
                )}
                {actionError && (
                    <p
                        className="flex items-start gap-2 border border-correction/30 bg-correction-subtle px-3 py-2 text-sm text-correction-subtle-foreground"
                        data-test="discussion-action-error"
                        role="alert"
                    >
                        <AlertCircle
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        <span>{actionError}</span>
                    </p>
                )}
            </div>

            <form
                className="grid gap-4 border border-border bg-muted/30 p-4 sm:p-5"
                onSubmit={submitDiscussion}
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
                        onChange={(event) => {
                            setBody(event.target.value);
                            setActionError(null);
                        }}
                        className="min-h-28 w-full resize-y border border-input bg-background px-3 py-2 text-base text-foreground transition-[color,background-color,border-color,box-shadow] duration-fast outline-none placeholder:text-muted-foreground hover:border-ring focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        maxLength={5000}
                        placeholder="Tulis hambatan kerja, keputusan, atau langkah berikutnya untuk tim"
                        aria-describedby="discussion-body-help discussion-body-error"
                        aria-invalid={Boolean(
                            firstError(discussionErrors, 'body'),
                        )}
                        disabled={
                            disabled ||
                            uncertain ||
                            discussionForm.processing ||
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
                            ref={fileInput}
                            id="discussion-file"
                            data-test="discussion-file"
                            type="file"
                            accept={ACCEPTED_FILE_TYPES}
                            onChange={selectFile}
                            className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                            disabled={
                                disabled ||
                                uncertain ||
                                discussionForm.processing ||
                                isUploading
                            }
                        />
                        <p className="text-xs leading-5 text-muted-foreground">
                            PDF, dokumen, spreadsheet, presentasi, gambar, atau
                            text. Maksimal 10 MB.
                        </p>
                        {selectedFile && (
                            <p className="flex items-center gap-2 text-sm text-foreground">
                                <FileText
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                <span className="min-w-0 truncate">
                                    {selectedFile.name} ·{' '}
                                    {formatFileSize(selectedFile.size)}
                                </span>
                                <button
                                    type="button"
                                    className="ml-auto inline-flex size-7 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                    onClick={() => setSelectedFile(null)}
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
                            checkForm.processing ||
                            discussionForm.processing ||
                            isUploading ||
                            body.trim() === ''
                        }
                        data-test="discussion-submit"
                    >
                        {discussionForm.processing ? (
                            <Spinner aria-hidden="true" />
                        ) : (
                            <Send aria-hidden="true" />
                        )}
                        Simpan catatan
                    </Button>
                </div>
            </form>

            {pendingUpload && (
                <div
                    className="grid gap-3 border border-border bg-background px-4 py-3"
                    data-test="discussion-attachment-upload"
                    role="status"
                    aria-live="polite"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold">
                                {pendingUpload.status === 'uploading'
                                    ? 'Mengunggah bukti'
                                    : 'Bukti belum tersimpan'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {pendingUpload.file.name}
                            </p>
                        </div>
                        {pendingUpload.status === 'failed' && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={retryUpload}
                                disabled={
                                    disabled ||
                                    uncertain ||
                                    isUploading ||
                                    checkForm.processing
                                }
                                data-test="discussion-upload-retry"
                            >
                                <RefreshCw aria-hidden="true" />
                                Coba unggah lagi
                            </Button>
                        )}
                    </div>
                    {pendingUpload.status === 'uploading' ? (
                        <div className="grid gap-2">
                            <progress
                                className="h-2 w-full accent-primary"
                                max={100}
                                value={uploadForm.progress?.percentage ?? 0}
                                aria-label="Kemajuan unggah bukti"
                            />
                            <p className="text-xs text-muted-foreground">
                                {uploadForm.progress?.percentage ?? 0}%{' '}
                                terkirim. File belum dianggap tersimpan sampai
                                server mengonfirmasi.
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-correction-subtle-foreground">
                            {pendingUpload.error ??
                                'File tetap tersedia untuk dicoba kembali.'}
                        </p>
                    )}
                    {pendingUpload.status === 'failed' && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-fit"
                            disabled={
                                uncertain || disabled || checkForm.processing
                            }
                            onClick={() => {
                                setPendingUpload(null);
                                setActionError(null);
                                setActionMessage(
                                    'Unggahan ulang dibatalkan. Catatan yang tersimpan tetap ada; periksa bukti pada diskusi sebelum melanjutkan.',
                                );
                            }}
                        >
                            Lanjut tanpa unggah ulang
                        </Button>
                    )}
                </div>
            )}

            <div
                className="grid gap-4"
                aria-busy={olderMessagesForm.processing}
                data-test="discussion-timeline"
            >
                <div className="flex items-center justify-between gap-3">
                    <p className="font-label text-label text-muted-foreground">
                        {initialPage.meta.total} catatan tersimpan
                    </p>
                    {olderMessagesForm.processing && (
                        <span
                            className="text-xs text-muted-foreground"
                            role="status"
                            aria-live="polite"
                            data-test="discussion-loading-status"
                        >
                            Memuat catatan sebelumnya...
                        </span>
                    )}
                </div>

                {discussionLoadError && (
                    <div
                        className="flex flex-wrap items-center justify-between gap-3 border border-correction/30 bg-correction-subtle px-3 py-3 text-sm text-correction-subtle-foreground"
                        role="alert"
                    >
                        <span className="flex items-start gap-2">
                            <AlertCircle
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            {discussionLoadError}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={loadOlderMessages}
                            disabled={olderMessagesForm.processing}
                        >
                            Coba lagi
                        </Button>
                    </div>
                )}

                {olderMessagesForm.processing && <DiscussionSkeleton />}

                {messages.length === 0 && !olderMessagesForm.processing ? (
                    <div
                        className="grid gap-3 border-y border-border px-4 py-10 text-center sm:px-8"
                        data-test="discussion-empty"
                    >
                        <p className="font-label text-label text-muted-foreground">
                            BELUM ADA CATATAN
                        </p>
                        <h3 className="text-lg font-semibold">
                            Belum ada diskusi tim
                        </h3>
                        <p className="mx-auto max-w-[54ch] text-sm leading-6 text-muted-foreground">
                            Gunakan catatan untuk keputusan, hambatan kerja, dan
                            serah terima yang perlu dibaca tim.
                        </p>
                    </div>
                ) : (
                    <ol
                        className="grid gap-5"
                        aria-label="Riwayat diskusi proyek"
                    >
                        {messages.map((message) => (
                            <DiscussionMessage
                                key={message.id}
                                message={message}
                                projectId={projectId}
                            />
                        ))}
                    </ol>
                )}
            </div>
        </section>
    );
}
