import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    FileSpreadsheet,
    FileText,
    FileUp,
    History,
    LoaderCircle,
    ShieldCheck,
    TableProperties,
    UploadCloud,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import {
    CampusOperationHeader,
    CampusWorkflowGuide,
    campusControlClass,
} from '@/components/campus-operation-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    preview as previewRoster,
    store as storeRoster,
} from '@/routes/campus/roster';

interface Institution {
    id: number;
    name: string;
}

interface RosterHistoryItem {
    id: number;
    semester: string;
    sourceFilename: string;
    status: 'active' | 'superseded';
    totalRows: number;
    validRows: number;
    errorRows: number;
    rowsCount: number;
    activatedAt: string | null;
    supersededAt: string | null;
}

interface RosterPreview {
    semester: string;
    total_rows: number;
    valid_rows: number;
    error_rows: number;
    errors: Array<{
        row: number;
        errors: Record<string, string[]>;
    }>;
    preview: Array<{
        nim: string;
        nama: string;
        program_studi: string;
        angkatan: string;
        semester: string;
        is_active: boolean;
    }>;
}

interface RosterImportProps {
    institution: Institution;
    rosters: RosterHistoryItem[];
    preview?: RosterPreview;
}

const rosterStatus = {
    active: {
        label: 'Aktif',
        className:
            'border-verified/30 bg-verified-subtle text-verified-subtle-foreground',
    },
    superseded: {
        label: 'Digantikan',
        className: 'border-border bg-accent/35 text-muted-foreground',
    },
};

function formatDate(value: string | null): string {
    if (value === null || Number.isNaN(new Date(value).getTime())) {
        return 'Belum tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function RosterHistoryTable({ rosters }: { rosters: RosterHistoryItem[] }) {
    if (rosters.length === 0) {
        return (
            <div className="grid justify-items-center gap-3 rounded-3xl border border-border bg-white px-6 py-14 text-center shadow-sm">
                <div className="flex size-12 items-center justify-center rounded-3xl bg-accent/70 text-primary">
                    <FileSpreadsheet aria-hidden="true" className="size-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                    Belum ada riwayat roster aktif
                </h3>
                <p className="mx-auto max-w-[45ch] text-xs leading-relaxed text-muted-foreground">
                    Unggah berkas CSV master data mahasiswa untuk menyiapkan
                    pencocokan afiliasi otomatis di kampus ini.
                </p>
            </div>
        );
    }

    return (
        <div
            role="region"
            aria-label="Riwayat roster. Gulir untuk melihat seluruh kolom."
            className="max-w-full overflow-x-auto rounded-3xl border border-border bg-white shadow-sm"
            tabIndex={0}
        >
            <table className="w-full min-w-[42rem] text-left text-xs">
                <thead>
                    <tr className="border-b border-border bg-accent/35 text-muted-foreground">
                        <th className="px-5 py-3.5 font-semibold">
                            Berkas Sumber
                        </th>
                        <th className="px-5 py-3.5 font-semibold">Semester</th>
                        <th className="px-5 py-3.5 font-semibold">
                            Baris Valid
                        </th>
                        <th className="px-5 py-3.5 font-semibold">Status</th>
                        <th className="px-5 py-3.5 font-semibold">
                            Diaktifkan Pada
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {rosters.map((roster) => (
                        <tr
                            key={roster.id}
                            className="transition-colors hover:bg-accent/35"
                        >
                            <td className="max-w-56 px-5 py-4 font-medium text-foreground">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/70 text-primary">
                                        <FileText className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span
                                            className="block truncate font-bold text-foreground"
                                            title={roster.sourceFilename}
                                        >
                                            {roster.sourceFilename}
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {roster.totalRows} baris data
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-4 font-semibold text-foreground">
                                {roster.semester}
                            </td>
                            <td className="px-5 py-4">
                                <span className="font-mono font-bold text-foreground">
                                    {roster.validRows}
                                </span>
                                {roster.errorRows > 0 && (
                                    <span className="ml-2 font-mono text-xs font-semibold text-correction-subtle-foreground">
                                        ({roster.errorRows} baris dilewati)
                                    </span>
                                )}
                            </td>
                            <td className="px-5 py-4">
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                        rosterStatus[roster.status].className,
                                    )}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="size-1.5 rounded-full bg-current"
                                    />
                                    {rosterStatus[roster.status].label}
                                </span>
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">
                                {formatDate(roster.activatedAt)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PreviewLedger({ preview }: { preview: RosterPreview }) {
    return (
        <section
            aria-labelledby="roster-preview-heading"
            className="overflow-hidden rounded-3xl border border-primary/15 bg-white shadow-md"
            data-test="roster-preview"
        >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-accent/70 px-4 py-5 sm:px-5">
                <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                        <TableProperties
                            aria-hidden="true"
                            className="size-4"
                        />
                        Pratinjau Siap Ditinjau
                    </div>
                    <h2
                        id="roster-preview-heading"
                        className="mt-1.5 text-lg font-bold text-foreground"
                    >
                        {preview.valid_rows} dari {preview.total_rows} Baris
                        Dapat Diimpor
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Semester <strong>{preview.semester}</strong>. Nomor
                        telepon diproses secara aman untuk pencocokan dan tidak
                        ditampilkan di pratinjau ini.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full border border-verified/30 bg-verified-subtle px-3 py-1 text-verified-subtle-foreground">
                        {preview.valid_rows} baris valid
                    </span>
                    {preview.error_rows > 0 && (
                        <span className="rounded-full border border-correction/30 bg-correction-subtle px-3 py-1 text-correction-subtle-foreground">
                            {preview.error_rows} baris perlu diperbaiki
                        </span>
                    )}
                </div>
            </div>

            {preview.preview.length > 0 && (
                <div
                    role="region"
                    aria-label="Pratinjau roster. Gulir untuk melihat seluruh kolom."
                    className="max-w-full overflow-x-auto focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    tabIndex={0}
                >
                    <table className="w-full min-w-[38rem] text-left text-xs">
                        <thead>
                            <tr className="border-b border-border bg-accent/35 text-muted-foreground">
                                <th className="px-5 py-3 font-semibold">NIM</th>
                                <th className="px-5 py-3 font-semibold">
                                    Nama Mahasiswa
                                </th>
                                <th className="px-5 py-3 font-semibold">
                                    Program Studi
                                </th>
                                <th className="px-5 py-3 font-semibold">
                                    Angkatan
                                </th>
                                <th className="px-5 py-3 font-semibold">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {preview.preview.map((row) => (
                                <tr
                                    key={`${row.nim}-${row.nama}`}
                                    className="hover:bg-accent/35/40 transition-colors"
                                >
                                    <td className="px-5 py-3 font-mono font-bold text-foreground">
                                        {row.nim}
                                    </td>
                                    <td className="px-5 py-3 font-medium text-foreground">
                                        {row.nama}
                                    </td>
                                    <td className="px-5 py-3 text-muted-foreground">
                                        {row.program_studi}
                                    </td>
                                    <td className="px-5 py-3 text-muted-foreground">
                                        {row.angkatan || 'Tidak diisi'}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                row.is_active
                                                    ? 'border border-verified/30 bg-verified-subtle text-verified-subtle-foreground'
                                                    : 'border border-border bg-accent/35 text-muted-foreground'
                                            }`}
                                        >
                                            {row.is_active
                                                ? 'Aktif'
                                                : 'Tidak aktif'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {preview.errors.length > 0 && (
                <div className="border-t border-border bg-correction-subtle px-4 py-4 sm:px-5">
                    <p className="text-xs font-bold text-correction-subtle-foreground">
                        Baris Yang Tidak Dapat Diproses:
                    </p>
                    <ul className="mt-2 grid gap-1.5 text-xs text-correction-subtle-foreground">
                        {preview.errors.slice(0, 5).map((error) => (
                            <li key={error.row}>
                                Baris {error.row}:{' '}
                                {Object.values(error.errors).flat().join(', ')}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}

function RosterContextRail() {
    return (
        <CampusWorkflowGuide
            title="Dari berkas ke roster aktif"
            steps={[
                {
                    title: 'Unggah berkas',
                    description: 'Pilih CSV dan isi label semester.',
                },
                {
                    title: 'Periksa pratinjau',
                    description:
                        'Cek data mahasiswa dan baris yang bermasalah.',
                },
                {
                    title: 'Impor setelah sesuai',
                    description:
                        'Impor baris valid. Riwayat roster tetap tersimpan.',
                },
            ]}
        >
            <p className="flex items-start gap-2">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-primary"
                />
                Nomor WhatsApp tidak ditampilkan dalam pratinjau.
            </p>
        </CampusWorkflowGuide>
    );
}

export default function RosterImport({
    institution,
    rosters,
    preview,
}: RosterImportProps) {
    const form = useForm<{ file: File | null; semester: string }>({
        file: null,
        semester: preview?.semester ?? '',
    });
    const [isCommitting, setIsCommitting] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [accessUnavailable, setAccessUnavailable] = useState(false);

    function requestFailure(status?: number) {
        if (status === 403 || status === 404) {
            setAccessUnavailable(true);
        }

        setFeedback(
            'Hasil request belum dapat dikonfirmasi. Periksa koneksi atau akses, lalu muat ulang sebelum mencoba kembali.',
        );

        return false;
    }

    function reloadRoster() {
        if (isCommitting || form.processing) {
            return;
        }

        setIsCommitting(true);
        router.reload({
            onSuccess: () => {
                setAccessUnavailable(false);
                setFeedback(null);
            },
            onHttpException: (response) => requestFailure(response.status),
            onNetworkError: () => requestFailure(),
            onFinish: () => setIsCommitting(false),
        });
    }

    function submitPreview(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (form.processing || isCommitting) {
            return;
        }

        setFeedback(null);
        setSuccess(null);
        form.post(previewRoster({ institution: institution.id }).url, {
            forceFormData: true,
            preserveScroll: true,
            onError: () =>
                setFeedback(
                    'Pratinjau belum dibuat. Periksa isian yang ditandai.',
                ),
            onHttpException: (response) => requestFailure(response.status),
            onNetworkError: () => requestFailure(),
        });
    }

    function commitRoster(): void {
        if (
            isCommitting ||
            form.processing ||
            !preview ||
            preview.valid_rows === 0
        ) {
            return;
        }

        setIsCommitting(true);
        setFeedback(null);
        setSuccess(null);

        router.post(
            storeRoster({ institution: institution.id }).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    setSuccess(
                        'Roster berhasil diimpor. Periksa statusnya pada riwayat roster.',
                    ),
                onError: (errors) =>
                    setFeedback(
                        Object.values(errors)[0] ??
                            'Roster belum diimpor. Periksa pratinjau dan coba lagi.',
                    ),
                onHttpException: (response) => requestFailure(response.status),
                onNetworkError: () => requestFailure(),
                onFinish: () => setIsCommitting(false),
            },
        );
    }

    return (
        <>
            <Head title={`Roster Mahasiswa - ${institution.name} | SATU`} />

            <AppPage>
                <div className="space-y-6" data-test="campus-roster-root">
                    <CampusOperationHeader
                        theme="roster"
                        title="Roster mahasiswa"
                        description="Siapkan data mahasiswa untuk pencocokan afiliasi. Periksa pratinjau sebelum mengaktifkan roster baru."
                        institution={institution.name}
                        icon={FileSpreadsheet}
                    />
                    {feedback && (
                        <div
                            role="alert"
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm text-correction-subtle-foreground"
                        >
                            <p>{feedback}</p>
                            <Button
                                variant="outline"
                                disabled={isCommitting || form.processing}
                                onClick={reloadRoster}
                            >
                                Muat ulang roster
                            </Button>
                        </div>
                    )}
                    {success && (
                        <p
                            role="status"
                            className="rounded-2xl border border-verified/30 bg-verified-subtle p-4 text-sm text-verified-subtle-foreground"
                        >
                            {success}
                        </p>
                    )}
                    {accessUnavailable ? (
                        <section className="rounded-3xl border border-border bg-white p-5">
                            <h2 className="text-lg font-bold">
                                Akses roster tidak tersedia
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Data sebelumnya disembunyikan. Periksa akses
                                Admin Universitas sebelum memuat ulang.
                            </p>
                        </section>
                    ) : (
                        <>
                            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                                {/* Roster Upload Card */}
                                <section
                                    aria-labelledby="roster-upload-heading"
                                    className="@container min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5"
                                >
                                    <div className="flex items-center gap-2 border-b border-border pb-4">
                                        <UploadCloud className="size-5 text-primary" />
                                        <div>
                                            <h2
                                                id="roster-upload-heading"
                                                className="text-base font-bold text-foreground"
                                            >
                                                Impor Roster Baru
                                            </h2>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Gunakan berkas CSV dengan kolom
                                                NIM, nama, program studi,
                                                angkatan, semester, nomor
                                                telepon, dan status aktif.
                                            </p>
                                        </div>
                                    </div>

                                    <form
                                        onSubmit={submitPreview}
                                        className="mt-5 grid gap-5"
                                    >
                                        <div className="grid min-w-0 gap-4 @min-[32rem]:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="roster-file"
                                                    className="text-sm font-semibold text-foreground"
                                                >
                                                    Berkas CSV mahasiswa
                                                </Label>
                                                <Input
                                                    id="roster-file"
                                                    disabled={
                                                        form.processing ||
                                                        isCommitting
                                                    }
                                                    type="file"
                                                    accept=".csv,text/csv,text/plain"
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'file',
                                                            event.currentTarget
                                                                .files?.[0] ??
                                                                null,
                                                        )
                                                    }
                                                    aria-describedby="roster-file-help roster-file-error"
                                                    aria-invalid={Boolean(
                                                        form.errors.file,
                                                    )}
                                                    className={cn(
                                                        campusControlClass,
                                                        'cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1 file:text-sm file:font-semibold file:text-primary',
                                                    )}
                                                />
                                                <p
                                                    id="roster-file-help"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Maksimum 10 MB. Format .csv
                                                    atau .txt.
                                                </p>
                                                {form.errors.file && (
                                                    <p
                                                        id="roster-file-error"
                                                        className="text-xs font-semibold text-correction-subtle-foreground"
                                                    >
                                                        {form.errors.file}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="roster-semester"
                                                    className="text-sm font-semibold text-foreground"
                                                >
                                                    Label Semester
                                                </Label>
                                                <Input
                                                    id="roster-semester"
                                                    disabled={
                                                        form.processing ||
                                                        isCommitting
                                                    }
                                                    aria-describedby={
                                                        form.errors.semester
                                                            ? 'roster-semester-error'
                                                            : undefined
                                                    }
                                                    value={form.data.semester}
                                                    placeholder="Contoh: 2026/2027 Ganjil"
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'semester',
                                                            event.currentTarget
                                                                .value,
                                                        )
                                                    }
                                                    aria-invalid={Boolean(
                                                        form.errors.semester,
                                                    )}
                                                    className={
                                                        campusControlClass
                                                    }
                                                />
                                                {form.errors.semester && (
                                                    <p
                                                        id="roster-semester-error"
                                                        role="alert"
                                                        className="text-xs font-semibold text-correction-subtle-foreground"
                                                    >
                                                        {form.errors.semester}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={
                                                form.processing || isCommitting
                                            }
                                            className="min-h-11 w-full cursor-pointer justify-self-end rounded-xl bg-primary px-5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed sm:w-auto"
                                        >
                                            {form.processing ? (
                                                <LoaderCircle
                                                    aria-hidden="true"
                                                    className="mr-1.5 size-3.5 animate-spin motion-reduce:animate-none"
                                                />
                                            ) : (
                                                <FileUp
                                                    aria-hidden="true"
                                                    className="mr-1.5 size-3.5"
                                                />
                                            )}
                                            {form.processing
                                                ? 'Menyiapkan pratinjau...'
                                                : 'Tinjau Berkas'}
                                        </Button>
                                    </form>
                                </section>

                                <RosterContextRail />
                            </div>
                            {/* Preview Section */}
                            {preview && (
                                <div className="space-y-4">
                                    <PreviewLedger preview={preview} />
                                    {preview.valid_rows === 0 ? (
                                        <Alert
                                            variant="destructive"
                                            className="rounded-3xl border-correction/30 bg-correction-subtle text-correction-subtle-foreground shadow-sm"
                                        >
                                            <AlertTriangle
                                                aria-hidden="true"
                                                className="size-4 text-correction-subtle-foreground"
                                            />
                                            <AlertTitle className="font-bold">
                                                Tidak ada baris yang dapat
                                                diimpor
                                            </AlertTitle>
                                            <AlertDescription className="text-xs text-correction-subtle-foreground">
                                                Perbaiki struktur berkas CSV,
                                                lalu unggah kembali untuk
                                                membuat pratinjau baru.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white p-5 shadow-sm">
                                            <p className="text-xs text-muted-foreground">
                                                {preview.error_rows > 0
                                                    ? 'Baris yang tidak valid tidak akan diimpor. Pastikan jumlah baris valid sudah sesuai.'
                                                    : 'Semua baris telah siap diimpor ke master data.'}
                                            </p>
                                            <Button
                                                type="button"
                                                onClick={commitRoster}
                                                disabled={
                                                    isCommitting ||
                                                    form.processing
                                                }
                                                className="min-h-11 cursor-pointer rounded-xl bg-emerald-700 px-5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed"
                                            >
                                                {isCommitting ? (
                                                    <LoaderCircle
                                                        aria-hidden="true"
                                                        className="mr-1.5 size-3.5 animate-spin motion-reduce:animate-none"
                                                    />
                                                ) : (
                                                    <CheckCircle2
                                                        aria-hidden="true"
                                                        className="mr-1.5 size-3.5"
                                                    />
                                                )}
                                                {isCommitting
                                                    ? 'Mengimpor roster...'
                                                    : `Impor ${preview.valid_rows} Baris Valid`}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Roster History Section */}
                            <section
                                aria-labelledby="roster-history-heading"
                                className="space-y-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <History
                                            aria-hidden="true"
                                            className="size-5 text-primary"
                                        />
                                        <div>
                                            <h2
                                                id="roster-history-heading"
                                                className="text-base font-bold text-foreground"
                                            >
                                                Riwayat Roster Kampus
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Roster yang digantikan tetap
                                                tercatat sebagai riwayat impor.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-accent/35 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                                        Total: {rosters.length} Impor
                                    </span>
                                </div>

                                <RosterHistoryTable rosters={rosters} />
                            </section>
                        </>
                    )}
                </div>
            </AppPage>
        </>
    );
}

RosterImport.layout = {
    breadcrumbs: [
        {
            title: 'Operasi Kampus',
            href: '#',
        },
        {
            title: 'Roster Mahasiswa',
            href: '#',
        },
    ],
};
