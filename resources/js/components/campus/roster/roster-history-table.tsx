import { FileSpreadsheet, FileText, History } from 'lucide-react';
import type { RosterHistoryItem } from '@/components/campus/roster/roster-types';
import {
    formatDate,
    rosterStatus,
} from '@/components/campus/roster/roster-types';
import { cn } from '@/lib/utils';

export function RosterHistoryTable({
    rosters,
}: {
    rosters: RosterHistoryItem[];
}) {
    return (
        <section aria-labelledby="roster-history-heading" className="space-y-4">
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
                            Roster yang digantikan tetap tercatat sebagai
                            riwayat impor.
                        </p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-accent/35 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                    Total: {rosters.length} Impor
                </span>
            </div>

            {rosters.length === 0 ? (
                <div className="grid justify-items-center gap-3 rounded-3xl border border-border bg-white px-6 py-14 text-center shadow-sm">
                    <div className="flex size-12 items-center justify-center rounded-3xl bg-accent/70 text-primary">
                        <FileSpreadsheet
                            aria-hidden="true"
                            className="size-6"
                        />
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                        Belum ada riwayat roster aktif
                    </h3>
                    <p className="mx-auto max-w-[45ch] text-xs leading-relaxed text-muted-foreground">
                        Unggah berkas CSV master data mahasiswa untuk menyiapkan
                        pencocokan afiliasi otomatis di kampus ini.
                    </p>
                </div>
            ) : (
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
                                <th className="px-5 py-3.5 font-semibold">
                                    Semester
                                </th>
                                <th className="px-5 py-3.5 font-semibold">
                                    Baris Valid
                                </th>
                                <th className="px-5 py-3.5 font-semibold">
                                    Status
                                </th>
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
                                                    title={
                                                        roster.sourceFilename
                                                    }
                                                >
                                                    {roster.sourceFilename}
                                                </span>
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {roster.totalRows} baris
                                                    data
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
                                                ({roster.errorRows} baris
                                                dilewati)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                                rosterStatus[roster.status]
                                                    .className,
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
            )}
        </section>
    );
}
