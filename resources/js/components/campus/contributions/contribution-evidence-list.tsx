import { ArrowDownToLine, Eye, FileCheck2 } from 'lucide-react';
import { formatFileSize } from '@/components/campus/contributions/contribution-types';
import type { ContributionReviewQueueItem } from '@/components/campus/contributions/contribution-types';
import {
    download as downloadAttachment,
    preview as previewAttachment,
} from '@/routes/projects/workspace/attachments';

type EvidenceItem = NonNullable<
    ContributionReviewQueueItem['current_version']
>['evidence'][number];

interface ContributionEvidenceListProps {
    evidence: EvidenceItem[];
    projectId: number;
}

export function ContributionEvidenceList({
    evidence,
    projectId,
}: ContributionEvidenceListProps) {
    return (
        <section
            aria-labelledby="contribution-evidence-title"
            className="space-y-2"
        >
            <div className="flex items-center justify-between">
                <h3
                    id="contribution-evidence-title"
                    className="text-sm font-semibold text-foreground"
                >
                    Bukti privat
                </h3>
                <span className="font-mono text-xs text-muted-foreground">
                    {evidence.length} berkas
                </span>
            </div>
            {evidence.length === 0 ? (
                <p className="rounded-xl border border-border bg-accent/35 p-3 text-center text-xs text-muted-foreground">
                    Tidak ada bukti yang ditautkan ke versi ini.
                </p>
            ) : (
                <ul className="space-y-2">
                    {evidence.map((item) => {
                        const attachment = item.attachment;

                        return (
                            <li
                                key={item.id}
                                className="rounded-xl border border-border bg-accent/35 p-3 text-xs"
                            >
                                <div className="flex items-start gap-2.5">
                                    <FileCheck2
                                        aria-hidden="true"
                                        className="mt-0.5 size-4 shrink-0 text-verified-subtle-foreground"
                                    />
                                    <div className="min-w-0">
                                        <p className="font-bold break-words text-foreground">
                                            {attachment?.original_name ??
                                                item.source_label}
                                        </p>
                                        {attachment && (
                                            <p className="font-mono text-xs text-muted-foreground">
                                                {attachment.mime_type} •{' '}
                                                {formatFileSize(
                                                    attachment.size_bytes,
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {item.notes && (
                                    <p className="mt-1.5 pl-6 text-muted-foreground">
                                        {item.notes}
                                    </p>
                                )}
                                {!item.available && (
                                    <p className="mt-2 pl-6 text-xs leading-5 text-muted-foreground">
                                        Bukti tidak tersedia untuk dibuka.
                                    </p>
                                )}
                                {item.available && attachment && (
                                    <div className="mt-2 flex items-center gap-3 pl-6 font-semibold">
                                        <a
                                            href={
                                                previewAttachment({
                                                    project: projectId,
                                                    attachment: attachment.id,
                                                }).url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex min-h-11 cursor-pointer items-center gap-1 text-primary hover:underline"
                                        >
                                            <Eye className="size-3.5" />
                                            Pratinjau
                                        </a>
                                        <a
                                            href={
                                                downloadAttachment({
                                                    project: projectId,
                                                    attachment: attachment.id,
                                                }).url
                                            }
                                            className="inline-flex min-h-11 cursor-pointer items-center gap-1 text-primary hover:underline"
                                        >
                                            <ArrowDownToLine className="size-3.5" />
                                            Unduh
                                        </a>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
