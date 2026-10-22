import { Download, FileText, ImageIcon } from 'lucide-react';
import {
    download as attachmentDownload,
    preview as attachmentPreview,
} from '@/routes/projects/workspace/attachments';
import type { WorkspaceAttachment } from '@/types/task';
import { formatDateTime, formatFileSize } from './discussion-utils';

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
