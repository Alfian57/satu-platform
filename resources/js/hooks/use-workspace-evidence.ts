import { useHttp } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    index,
    store,
} from '@/actions/App/Http/Controllers/ProjectAttachmentController';
import type { WorkspaceAttachment, WorkspaceEvidencePage } from '@/types/task';

export interface UseWorkspaceEvidenceOptions {
    projectId: number;
    initialPage: WorkspaceEvidencePage;
    disabled: boolean;
    onForbidden: () => void;
}

export function useWorkspaceEvidence({
    projectId,
    initialPage,
    disabled,
    onForbidden,
}: UseWorkspaceEvidenceOptions) {
    const [page, setPage] = useState(initialPage);
    const [file, setFile] = useState<File | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uncertain, setUncertain] = useState(false);
    const commandLock = useRef(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const focusValidation = useRef(false);

    const upload = useHttp<
        { file: File | null; purpose: 'evidence'; message_id: null },
        { data: WorkspaceAttachment }
    >({ file: null, purpose: 'evidence', message_id: null });
    const read = useHttp<Record<string, never>, WorkspaceEvidencePage>({});

    useEffect(() => {
        if (!upload.processing && !disabled && focusValidation.current) {
            focusValidation.current = false;
            fileInput.current?.focus();
        }
    }, [upload.processing, upload.errors, disabled]);

    useEffect(() => {
        let active = true;
        queueMicrotask(() => {
            if (active) {
                setPage(initialPage);
            }
        });

        return () => {
            active = false;
        };
    }, [initialPage]);

    function readPage(number: number, checking = false) {
        if (read.processing || disabled || commandLock.current) {
            return;
        }

        setError(null);
        read.get(index(projectId, { query: { evidence_page: number } }).url, {
            onHttpException: (response) => {
                if (response.status === 403 || response.status === 404) {
                    onForbidden();
                }

                setError(
                    'Daftar bukti belum dapat diperiksa. Coba muat ulang.',
                );

                return false;
            },
            onNetworkError: () => {
                setError(
                    'Daftar bukti belum dapat diperiksa. Periksa koneksi dan coba lagi.',
                );

                return false;
            },
        })
            .then((response) => {
                if (!response?.data || !response?.meta) {
                    return;
                }

                setPage(response);

                if (checking) {
                    setUncertain(false);
                    setNotice(
                        'Daftar terbaru sudah dibaca. Periksa nama dan waktu unggah sebelum mengirim ulang. Berkas yang sama tidak akan digandakan.',
                    );
                }

                heading.current?.focus();
            })
            .catch(() => undefined);
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (
            !file ||
            disabled ||
            uncertain ||
            read.processing ||
            commandLock.current
        ) {
            return;
        }

        commandLock.current = true;
        setNotice(null);
        setError(null);
        upload.transform(() => ({
            file,
            purpose: 'evidence',
            message_id: null,
        }));
        upload
            .post(store(projectId).url, {
                onError: () => {
                    focusValidation.current = true;
                },
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        onForbidden();
                    }

                    setUncertain(true);
                    setError(
                        'Hasil unggah belum dapat dipastikan. Periksa daftar terbaru sebelum mencoba lagi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setUncertain(true);
                    setError(
                        'Koneksi terputus. Berkas tetap dipilih, tetapi hasil unggah belum pasti. Periksa daftar terbaru.',
                    );

                    return false;
                },
            })
            .then(async (response) => {
                if (!response?.data) {
                    return;
                }

                setFile(null);

                if (fileInput.current) {
                    fileInput.current.value = '';
                }

                setNotice(
                    'Bukti tersimpan secara privat. Unggahan belum berarti kontribusi disetujui atau dipublikasikan.',
                );

                try {
                    const latest = await read.get(index(projectId).url, {
                        onHttpException: (failure) => {
                            if (
                                failure.status === 403 ||
                                failure.status === 404
                            ) {
                                onForbidden();
                            }

                            setUncertain(true);
                            setError(
                                'Bukti tersimpan, tetapi daftar terbaru belum dapat dimuat. Periksa daftar sebelum melanjutkan.',
                            );

                            return false;
                        },
                        onNetworkError: () => {
                            setUncertain(true);
                            setError(
                                'Bukti tersimpan, tetapi daftar terbaru belum dapat dimuat. Coba muat ulang.',
                            );

                            return false;
                        },
                    });

                    if (latest?.data && latest?.meta) {
                        setPage(latest);
                    }
                } catch {
                    // Respons unggah sudah mengonfirmasi penyimpanan.
                }
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    return {
        state: {
            page,
            file,
            notice,
            error,
            uncertain,
        },
        forms: {
            upload,
            read,
        },
        actions: {
            setFile: (newFile: File | null) => {
                setFile(newFile);
                upload.clearErrors();
            },
            readPage,
            submit,
        },
        refs: {
            fileInput,
            heading,
        },
    };
}
