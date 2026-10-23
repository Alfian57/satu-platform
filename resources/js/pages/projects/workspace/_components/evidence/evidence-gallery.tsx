import { Spinner } from '@/components/ui/spinner';
import { AttachmentItem } from '@/pages/projects/workspace/_components/discussion/attachment-item';
import type { WorkspaceAttachment } from '@/types/task';

type Props = {
    projectId: number;
    attachments: WorkspaceAttachment[];
    isReadProcessing: boolean;
};

export function EvidenceGallery({
    projectId,
    attachments,
    isReadProcessing,
}: Props) {
    return (
        <div aria-busy={isReadProcessing}>
            {isReadProcessing && (
                <p
                    role="status"
                    className="mb-3 flex items-center gap-2 text-sm"
                >
                    <Spinner aria-hidden="true" />
                    Memeriksa bukti tersimpan...
                </p>
            )}
            {attachments.length ? (
                <ul
                    className="grid min-w-0 gap-4"
                    aria-label="Bukti privat tanpa pesan"
                >
                    {attachments.map((attachment) => (
                        <AttachmentItem
                            key={attachment.id}
                            attachment={attachment}
                            projectId={projectId}
                        />
                    ))}
                </ul>
            ) : (
                <p className="rounded-2xl border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">
                    Belum ada bukti tanpa pesan di halaman ini. Mulai dari hasil
                    kerja yang bisa diperiksa, bukan seberapa sering kamu
                    berbicara.
                </p>
            )}
        </div>
    );
}
