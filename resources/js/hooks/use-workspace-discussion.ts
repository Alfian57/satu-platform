import { useHttp } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { store as attachmentStore } from '@/actions/App/Http/Controllers/ProjectAttachmentController';
import {
    index as discussionIndex,
    store as discussionStore,
} from '@/actions/App/Http/Controllers/ProjectDiscussionController';
import { firstError } from '@/components/projects/discussion/discussion-utils';
import type {
    AttachmentResponse,
    DiscussionFormData,
    DiscussionQueryData,
    ErrorMap,
    MessageResponse,
    PendingUpload,
    UploadFormData,
} from '@/components/projects/discussion/discussion-utils';
import type { DiscussionPage, WorkspaceDiscussion } from '@/types/task';

export interface UseWorkspaceDiscussionOptions {
    projectId: number;
    initialPage: DiscussionPage;
    disabled: boolean;
    onForbidden: () => void;
}

export function useWorkspaceDiscussion({
    projectId,
    initialPage,
    disabled,
    onForbidden,
}: UseWorkspaceDiscussionOptions) {
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

    function dismissActionAlerts(): void {
        setActionMessage(null);
        setActionError(null);
    }

    function cancelPendingUploadRetry(): void {
        setPendingUpload(null);
        setActionError(null);
        setActionMessage(
            'Unggahan ulang dibatalkan. Catatan yang tersimpan tetap ada; periksa bukti pada diskusi sebelum melanjutkan.',
        );
    }

    return {
        state: {
            uncertain,
            messages,
            currentPage,
            lastPage,
            body,
            selectedFile,
            pendingUpload,
            actionMessage,
            actionError,
            discussionLoadError,
            isUploading,
            canLoadOlder,
        },
        forms: {
            discussionForm,
            olderMessagesForm,
            checkForm,
            uploadForm,
        },
        errors: {
            discussionErrors,
        },
        actions: {
            setBody: (val: string) => {
                setBody(val);
                setActionError(null);
            },
            setSelectedFile,
            submitDiscussion,
            loadOlderMessages,
            checkLatest,
            selectFile,
            retryUpload,
            dismissActionAlerts,
            cancelPendingUploadRetry,
        },
        refs: {
            fileInput,
        },
    };
}
