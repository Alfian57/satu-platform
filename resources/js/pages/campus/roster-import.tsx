import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    FileCheck2,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { index as affiliationIndex } from '@/routes/campus/affiliations';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';
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
        className: 'border-emerald-200/80 bg-emerald-50 text-emerald-800',
    },
    superseded: {
        label: 'Digantikan',
        className: 'border-slate-200 bg-slate-50 text-slate-600',
    },
};

function formatDate(value: string | null): string {
    if (value === null) {
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
            <div className="grid justify-items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-xs">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <FileSpreadsheet aria-hidden="true" className="size-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                    Belum ada riwayat roster aktif
                </h3>
                <p className="mx-auto max-w-[45ch] text-xs leading-relaxed text-slate-500">
                    Unggah berkas CSV master data mahasiswa untuk menyiapkan
                    pencocokan afiliasi otomatis di kampus ini.
                </p>
            </div>
        );
    }

    return (
        <div
            className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs"
            tabIndex={0}
        >
            <table className="w-full min-w-[42rem] text-left text-xs">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-600">
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
                <tbody className="divide-y divide-slate-100">
                    {rosters.map((roster) => (
                        <tr
                            key={roster.id}
                            className="transition-colors hover:bg-slate-50/60"
                        >
                            <td className="max-w-56 px-5 py-4 font-medium text-slate-900">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                        <FileText className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span
                                            className="block truncate font-bold text-slate-900"
                                            title={roster.sourceFilename}
                                        >
                                            {roster.sourceFilename}
                                        </span>
                                        <span className="font-mono text-[0.6875rem] text-slate-400">
                                            {roster.totalRows} baris data
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-700">
                                {roster.semester}
                            </td>
                            <td className="px-5 py-4">
                                <span className="font-mono font-bold text-slate-900">
                                    {roster.validRows}
                                </span>
                                {roster.errorRows > 0 && (
                                    <span className="ml-2 font-mono text-xs font-semibold text-rose-600">
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
                            <td className="px-5 py-4 text-slate-500">
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
            className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md"
            data-test="roster-preview"
        >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-blue-50/30 px-6 py-5">
                <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                        <TableProperties
                            aria-hidden="true"
                            className="size-4"
                        />
                        Pratinjau Siap Ditinjau
                    </div>
                    <h2
                        id="roster-preview-heading"
                        className="mt-1.5 text-lg font-bold text-slate-950"
                    >
                        {preview.valid_rows} dari {preview.total_rows} Baris
                        Dapat Diimpor
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        Semester <strong>{preview.semester}</strong>. Nomor
                        telepon diproses secara aman untuk pencocokan dan tidak
                        ditampilkan di pratinjau ini.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
                        {preview.valid_rows} baris valid
                    </span>
                    {preview.error_rows > 0 && (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-800">
                            {preview.error_rows} baris perlu diperbaiki
                        </span>
                    )}
                </div>
            </div>

            {preview.preview.length > 0 && (
                <div className="overflow-x-auto" tabIndex={0}>
                    <table className="w-full min-w-[38rem] text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-600">
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
                        <tbody className="divide-y divide-slate-100">
                            {preview.preview.map((row) => (
                                <tr
                                    key={`${row.nim}-${row.nama}`}
                                    className="transition-colors hover:bg-slate-50/40"
                                >
                                    <td className="px-5 py-3 font-mono font-bold text-slate-900">
                                        {row.nim}
                                    </td>
                                    <td className="px-5 py-3 font-medium text-slate-900">
                                        {row.nama}
                                    </td>
                                    <td className="px-5 py-3 text-slate-600">
                                        {row.program_studi}
                                    </td>
                                    <td className="px-5 py-3 text-slate-600">
                                        {row.angkatan || 'Tidak diisi'}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
                                                row.is_active
                                                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                                                    : 'border border-slate-200 bg-slate-50 text-slate-600'
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
                <div className="border-t border-slate-100 bg-rose-50/30 px-6 py-4">
                    <p className="text-xs font-bold text-rose-700">
                        Baris Yang Tidak Dapat Diproses:
                    </p>
                    <ul className="mt-2 grid gap-1.5 text-xs text-rose-900/90">
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

function RosterContextRail({ institution }: { institution: Institution }) {
    return (
        <div className="grid gap-6">
            {/* Card 1: Konteks Roster */}
            <section
                aria-labelledby="roster-scope-heading"
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
            >
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Building2 className="size-3.5" aria-hidden="true" />
                    </span>
                    <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                        KONTEKS ROSTER
                    </p>
                </div>

                <h2
                    id="roster-scope-heading"
                    className="mt-3 text-base font-bold tracking-tight text-slate-950"
                >
                    {institution.name}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Roster aktif menjadi basis verifikasi NIM dan nomor WhatsApp
                    untuk pencocokan instan afiliasi mahasiswa.
                </p>
            </section>

            {/* Card 2: Privasi Data */}
            <section
                aria-labelledby="roster-safety-heading"
                className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-4.5"
            >
                <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-4.5 shrink-0 text-blue-600" />
                    <div>
                        <h2
                            id="roster-safety-heading"
                            className="text-xs font-bold text-blue-900"
                        >
                            Privasi Terlindungi
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
                            Nomor telepon diproses dalam bentuk hash terlindungi
                            dan tidak pernah diekspos pada pratinjau maupun
                            tampilan publik.
                        </p>
                    </div>
                </div>
            </section>

            {/* Card 3: Modul Terkait */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                    MODUL OPERASIONAL
                </p>

                <div className="mt-3.5 grid gap-2">
                    <Link
                        href={affiliationIndex({
                            institution: institution.id,
                        })}
                        prefetch
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs font-semibold text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-900"
                    >
                        <div className="flex items-center gap-2.5">
                            <ClipboardCheck className="size-4 text-blue-600" />
                            <span>Review Afiliasi</span>
                        </div>
                        <ChevronRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </Link>

                    <Link
                        href={campusContributionsIndex({
                            institution: institution.id,
                        })}
                        prefetch
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs font-semibold text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-900"
                    >
                        <div className="flex items-center gap-2.5">
                            <FileCheck2 className="size-4 text-indigo-600" />
                            <span>Validasi Kontribusi</span>
                        </div>
                        <ChevronRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </Link>
                </div>
            </section>
        </div>
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

    function submitPreview(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(previewRoster({ institution: institution.id }).url, {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    function commitRoster(): void {
        setIsCommitting(true);

        router.post(
            storeRoster({ institution: institution.id }).url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsCommitting(false),
            },
        );
    }

    return (
        <>
            <Head title={`Roster Mahasiswa - ${institution.name} | SATU`} />

            <AppPage
                contextRail={<RosterContextRail institution={institution} />}
                contextRailLabel="Konteks dan perlindungan roster"
            >
                <div className="space-y-6" data-test="campus-roster-root">
                    {/* Header Banner */}
                    <header className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-white px-6 py-6 shadow-[0_18px_50px_-36px_rgba(30,64,175,0.35)] sm:px-8 sm:py-7">
                        <div
                            aria-hidden="true"
                            className="absolute -top-28 -right-24 size-80 rounded-full bg-blue-100/75 blur-3xl sm:-right-12"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute right-14 bottom-0 hidden h-24 w-24 rounded-tl-[2.5rem] border-t border-l border-indigo-100 sm:block"
                        />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                    <FileSpreadsheet className="size-3 text-blue-600" />
                                    Operasi Kampus
                                </div>

                                <h1 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                                    Roster Mahasiswa
                                </h1>

                                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-slate-600">
                                    Perbarui dan kelola data master mahasiswa
                                    aktif secara terkontrol untuk mendukung
                                    verifikasi afiliasi otomatis di{' '}
                                    <span className="font-semibold text-slate-900">
                                        {institution.name}
                                    </span>
                                    .
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-2.5 text-xs font-semibold text-blue-800">
                                <Building2 className="size-4 text-blue-600" />
                                <span>{institution.name}</span>
                            </div>
                        </div>
                    </header>

                    {/* Roster Upload Card */}
                    <section
                        aria-labelledby="roster-upload-heading"
                        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"
                    >
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                            <UploadCloud className="size-5 text-blue-600" />
                            <div>
                                <h2
                                    id="roster-upload-heading"
                                    className="text-base font-bold text-slate-900"
                                >
                                    Impor Roster Baru
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Gunakan berkas CSV dengan kolom NIM, nama,
                                    program studi, angkatan, semester, nomor
                                    telepon, dan status aktif.
                                </p>
                            </div>
                        </div>

                        <form
                            onSubmit={submitPreview}
                            className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
                        >
                            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,16rem)]">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="roster-file"
                                        className="text-xs font-bold text-slate-700"
                                    >
                                        Berkas CSV Master Mahasiswa
                                    </Label>
                                    <Input
                                        id="roster-file"
                                        type="file"
                                        accept=".csv,text/csv,text/plain"
                                        onChange={(event) =>
                                            form.setData(
                                                'file',
                                                event.currentTarget
                                                    .files?.[0] ?? null,
                                            )
                                        }
                                        aria-describedby="roster-file-help roster-file-error"
                                        aria-invalid={Boolean(form.errors.file)}
                                        className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blue-700 focus:border-blue-600 focus:bg-white"
                                    />
                                    <p
                                        id="roster-file-help"
                                        className="text-[0.6875rem] text-slate-500"
                                    >
                                        Maksimum 10 MB. Format .csv atau .txt.
                                    </p>
                                    {form.errors.file && (
                                        <p
                                            id="roster-file-error"
                                            className="text-xs font-semibold text-rose-600"
                                        >
                                            {form.errors.file}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="roster-semester"
                                        className="text-xs font-bold text-slate-700"
                                    >
                                        Label Semester
                                    </Label>
                                    <Input
                                        id="roster-semester"
                                        value={form.data.semester}
                                        placeholder="Contoh: 2026/2027 Ganjil"
                                        onChange={(event) =>
                                            form.setData(
                                                'semester',
                                                event.currentTarget.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            form.errors.semester,
                                        )}
                                        className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white"
                                    />
                                    {form.errors.semester && (
                                        <p className="text-xs font-semibold text-rose-600">
                                            {form.errors.semester}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="h-10 cursor-pointer rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
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

                    {/* Preview Section */}
                    {preview && (
                        <div className="space-y-4">
                            <PreviewLedger preview={preview} />
                            {preview.valid_rows === 0 ? (
                                <Alert
                                    variant="destructive"
                                    className="rounded-2xl border-rose-200 bg-rose-50 text-rose-950 shadow-xs"
                                >
                                    <AlertTriangle
                                        aria-hidden="true"
                                        className="size-4 text-rose-600"
                                    />
                                    <AlertTitle className="font-bold">
                                        Tidak ada baris yang dapat diimpor
                                    </AlertTitle>
                                    <AlertDescription className="text-xs text-rose-800">
                                        Perbaiki struktur berkas CSV, lalu
                                        unggah kembali untuk membuat pratinjau
                                        baru.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                                    <p className="text-xs text-slate-600">
                                        {preview.error_rows > 0
                                            ? 'Baris yang tidak valid tidak akan diimpor. Pastikan jumlah baris valid sudah sesuai.'
                                            : 'Semua baris telah siap diimpor ke master data.'}
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={commitRoster}
                                        disabled={isCommitting}
                                        className="h-10 cursor-pointer rounded-xl bg-emerald-700 px-5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800"
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
                                    className="size-5 text-blue-600"
                                />
                                <div>
                                    <h2
                                        id="roster-history-heading"
                                        className="text-base font-bold text-slate-900"
                                    >
                                        Riwayat Roster Kampus
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Status roster sebelumnya tetap tercatat
                                        sebagai provenance operasional.
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                Total: {rosters.length} Impor
                            </span>
                        </div>

                        <RosterHistoryTable rosters={rosters} />
                    </section>
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
