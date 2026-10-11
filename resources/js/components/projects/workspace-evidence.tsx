import { useHttp } from '@inertiajs/react';
import { FileText, LockKeyhole, RefreshCw, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    index,
    store,
} from '@/actions/App/Http/Controllers/ProjectAttachmentController';
import InputError from '@/components/input-error';
import { AttachmentItem } from '@/components/projects/workspace-discussion';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { WorkspaceAttachment, WorkspaceEvidencePage } from '@/types/task';

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
                    // Respons unggah sudah mengonfirmasi penyimpanan. GET tidak mengirim ulang berkas.
                }
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    return (
        <section
            className="grid min-w-0 gap-5 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6"
            aria-labelledby="workspace-evidence-title"
            data-test="workspace-evidence"
        >
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                    <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <LockKeyhole className="size-4" aria-hidden="true" />{' '}
                        PRIVAT DI RUANG KERJA
                    </p>
                    <h2
                        id="workspace-evidence-title"
                        ref={heading}
                        tabIndex={-1}
                        className="text-title font-semibold"
                    >
                        Bukti pekerjaan
                    </h2>
                    <p className="max-w-[70ch] text-sm leading-6 text-muted-foreground">
                        Unggah hasil kerja tanpa harus menulis pesan. Tim yang
                        berizin dapat membacanya. Bukti tidak otomatis masuk
                        portofolio; pilih tugas dan bukti saat mencatat
                        Kontribusi individual.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled || upload.processing || read.processing}
                    onClick={() => readPage(1, uncertain)}
                    data-test="evidence-refresh"
                >
                    <RefreshCw aria-hidden="true" />
                    {uncertain ? 'Periksa hasil unggah' : 'Muat bukti terbaru'}
                </Button>
            </header>
            <form
                onSubmit={submit}
                className="grid min-w-0 gap-3 rounded-2xl bg-accent/50 p-4"
                aria-busy={upload.processing}
                data-test="evidence-form"
            >
                <label
                    htmlFor="workspace-evidence-file"
                    className="text-sm font-semibold"
                >
                    Pilih bukti privat
                </label>
                <input
                    ref={fileInput}
                    id="workspace-evidence-file"
                    type="file"
                    accept=".csv,.doc,.docx,.jpg,.jpeg,.pdf,.png,.ppt,.pptx,.txt,.webp,.xls,.xlsx"
                    onChange={(event) => {
                        setFile(event.target.files?.[0] ?? null);
                        upload.clearErrors();
                    }}
                    disabled={disabled || upload.processing || uncertain}
                    className="min-h-11 w-full min-w-0 cursor-pointer text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-background file:px-3 file:text-foreground disabled:cursor-not-allowed"
                    aria-describedby="evidence-help evidence-file-error"
                    aria-invalid={Boolean(upload.errors.file)}
                />
                <p
                    id="evidence-help"
                    className="text-xs leading-5 text-muted-foreground"
                >
                    Dokumen, spreadsheet, presentasi, gambar, atau teks.
                    Maksimal 10 MB. Tidak perlu pesan atau portofolio
                    sebelumnya.
                </p>
                <InputError
                    id="evidence-file-error"
                    message={upload.errors.file}
                />
                {file && (
                    <p className="text-sm wrap-anywhere">
                        <FileText
                            aria-hidden="true"
                            className="mr-2 inline size-4"
                        />
                        {file.name}
                    </p>
                )}
                <Button
                    type="submit"
                    className="w-full sm:w-fit"
                    disabled={
                        !file ||
                        disabled ||
                        uncertain ||
                        upload.processing ||
                        read.processing
                    }
                    data-test="evidence-submit"
                >
                    {upload.processing ? (
                        <Spinner aria-hidden="true" />
                    ) : (
                        <Upload aria-hidden="true" />
                    )}
                    Unggah bukti privat
                </Button>
                {upload.processing && (
                    <div role="status">
                        <progress
                            max={100}
                            value={upload.progress?.percentage ?? 0}
                            className="w-full accent-primary"
                            aria-label="Kemajuan unggah bukti"
                        />
                        <p className="text-xs">
                            {upload.progress?.percentage ?? 0}% terkirim.
                            Menunggu konfirmasi server.
                        </p>
                    </div>
                )}
            </form>
            {notice && (
                <p
                    role="status"
                    className="text-sm leading-6 text-primary"
                    data-test="evidence-success"
                >
                    {notice}
                </p>
            )}
            {error && (
                <p
                    role="alert"
                    className="text-sm leading-6 text-correction"
                    data-test="evidence-error"
                >
                    {error}
                </p>
            )}
            <div aria-busy={read.processing}>
                {read.processing && (
                    <p
                        role="status"
                        className="mb-3 flex items-center gap-2 text-sm"
                    >
                        <Spinner aria-hidden="true" />
                        Memeriksa bukti tersimpan...
                    </p>
                )}
                {page.data.length ? (
                    <ul
                        className="grid min-w-0 gap-4"
                        aria-label="Bukti privat tanpa pesan"
                    >
                        {page.data.map((attachment) => (
                            <AttachmentItem
                                key={attachment.id}
                                attachment={attachment}
                                projectId={projectId}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className="rounded-2xl border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">
                        Belum ada bukti tanpa pesan di halaman ini. Mulai dari
                        hasil kerja yang bisa diperiksa, bukan seberapa sering
                        kamu berbicara.
                    </p>
                )}
            </div>
            {page.meta.last_page > 1 && (
                <nav
                    aria-label="Halaman bukti privat"
                    className="flex flex-wrap items-center gap-2"
                >
                    <Button
                        variant="outline"
                        disabled={
                            disabled ||
                            read.processing ||
                            upload.processing ||
                            page.meta.current_page <= 1
                        }
                        onClick={() => readPage(page.meta.current_page - 1)}
                    >
                        Sebelumnya
                    </Button>
                    <span className="text-xs">
                        {page.meta.current_page} / {page.meta.last_page}
                    </span>
                    <Button
                        variant="outline"
                        disabled={
                            disabled ||
                            read.processing ||
                            upload.processing ||
                            page.meta.current_page >= page.meta.last_page
                        }
                        onClick={() => readPage(page.meta.current_page + 1)}
                    >
                        Berikutnya
                    </Button>
                </nav>
            )}
        </section>
    );
}
