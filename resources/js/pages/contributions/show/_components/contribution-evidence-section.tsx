import { FileCheck2, FileWarning } from 'lucide-react';
import { formatFileSize } from '@/pages/contributions/_utils/contribution-helpers';
import { download as downloadAttachment } from '@/routes/projects/workspace/attachments';
import type { ContributionDetail } from '@/types/contribution';

export interface ContributionEvidenceSectionProps {
    projectId: number;
    evidence: NonNullable<ContributionDetail['current_version']>['evidence'];
}

export function ContributionEvidenceSection({
    projectId,
    evidence,
}: ContributionEvidenceSectionProps) {
    return (
        <section
            aria-labelledby="contribution-evidence-title"
            className="grid min-w-0 gap-5 rounded-3xl border border-primary/10 bg-linear-to-br from-accent/70 to-background p-5 sm:p-6"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold text-primary">
                        Bukti privat
                    </p>
                    <h2
                        id="contribution-evidence-title"
                        className="mt-1 text-title font-semibold"
                    >
                        Bukti yang ditautkan
                    </h2>
                </div>
                <span className="font-label text-label text-muted-foreground">
                    {evidence.length}/20 BERKAS
                </span>
            </div>
            {evidence.length === 0 ? (
                <div
                    data-test="contribution-missing-evidence"
                    className="flex min-w-0 items-start gap-3 rounded-2xl border border-pending/30 bg-pending-subtle p-4 text-sm leading-6 text-pending-subtle-foreground"
                >
                    <FileWarning
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0"
                    />
                    <p>
                        Belum ada bukti. Kontribusi dapat disimpan sebagai
                        draft, tetapi pengiriman untuk validasi membutuhkan
                        minimal satu berkas.
                    </p>
                </div>
            ) : (
                <ul
                    className="grid min-w-0 gap-3"
                    data-test="contribution-evidence-list"
                >
                    {evidence.map((item) => (
                        <li
                            key={item.id}
                            className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
                        >
                            {item.available ? (
                                <FileCheck2
                                    aria-hidden="true"
                                    className="mt-1 size-4 shrink-0 text-verified"
                                />
                            ) : (
                                <FileWarning
                                    aria-hidden="true"
                                    className="mt-1 size-4 shrink-0 text-correction"
                                />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold [overflow-wrap:anywhere]">
                                    {item.attachment?.original_name ??
                                        item.source_label}
                                </p>
                                <p className="mt-1 text-xs leading-5 [overflow-wrap:anywhere] text-muted-foreground">
                                    {item.available
                                        ? `${item.attachment?.mime_type ?? 'File'} · ${formatFileSize(item.attachment?.size_bytes ?? 0)}`
                                        : 'Berkas tidak lagi tersedia. Pilih bukti baru saat revisi.'}
                                </p>
                            </div>
                            <span className="col-start-2 text-xs font-semibold text-muted-foreground">
                                {item.available && item.attachment ? (
                                    <a
                                        href={
                                            downloadAttachment({
                                                project: projectId,
                                                attachment: item.attachment.id,
                                            }).url
                                        }
                                        className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary underline focus-visible:outline-2 focus-visible:outline-ring"
                                    >
                                        Unduh bukti privat
                                    </a>
                                ) : (
                                    'TIDAK TERSEDIA'
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
