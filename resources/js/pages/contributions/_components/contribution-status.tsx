import {
    Archive,
    CheckCircle2,
    CircleAlert,
    CircleDot,
    Clock3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContributionStatus } from '@/types/contribution';

export const contributionStatusMeta: Record<
    ContributionStatus,
    { label: string; description: string; nextStep: string; className: string }
> = {
    draft: {
        label: 'Draft',
        description: 'Belum dikirim untuk validasi kampus.',
        nextStep: 'Periksa draft sebelum mengirim.',
        className: 'border-border bg-muted text-muted-foreground',
    },
    pending: {
        label: 'Menunggu validasi',
        description: 'Sudah dikirim dan menunggu keputusan kampus.',
        nextStep: 'Tunggu keputusan validasi kampus.',
        className:
            'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    },
    revision: {
        label: 'Perlu diperbaiki',
        description: 'Tanggapi catatan kampus dengan menyimpan versi baru.',
        nextStep: 'Baca catatan kampus dan simpan versi baru.',
        className:
            'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
    },
    approved: {
        label: 'Tervalidasi',
        description: 'Versi ini sudah divalidasi oleh kampus.',
        nextStep: 'Kelola karya dan visibilitas di Portofolio.',
        className:
            'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
    },
    rejected: {
        label: 'Ditolak',
        description: 'Baca alasan keputusan pada riwayat validasi.',
        nextStep: 'Baca alasan keputusan kampus.',
        className:
            'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
    },
    archived: {
        label: 'Diarsipkan',
        description: 'Catatan ini tidak menerima perubahan baru.',
        nextStep: 'Baca catatan dan riwayat tersimpan.',
        className: 'border-border bg-muted text-muted-foreground',
    },
};

export function ContributionStatusBadge({
    status,
    className,
}: {
    status: ContributionStatus;
    className?: string;
}) {
    const meta = contributionStatusMeta[status];
    const Icon =
        status === 'approved'
            ? CheckCircle2
            : status === 'pending'
              ? Clock3
              : status === 'revision' || status === 'rejected'
                ? CircleAlert
                : status === 'archived'
                  ? Archive
                  : CircleDot;

    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                meta.className,
                className,
            )}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {meta.label}
        </span>
    );
}
