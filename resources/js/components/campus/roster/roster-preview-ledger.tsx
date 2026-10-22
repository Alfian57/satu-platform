import { TableProperties } from 'lucide-react';
import type { RosterPreview } from '@/components/campus/roster/roster-types';

export function RosterPreviewLedger({ preview }: { preview: RosterPreview }) {
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
                                    className="transition-colors hover:bg-accent/35"
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
