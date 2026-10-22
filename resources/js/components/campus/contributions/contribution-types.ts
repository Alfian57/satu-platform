import type {
    ContributionApiResponse,
    ContributionReview,
    ContributionReviewQueueItem,
    ContributionStatus,
} from '@/types/contribution';

export type ReviewDecision = 'approved' | 'revision' | 'rejected';

export type ReviewFilters = {
    q?: string;
    status: ContributionStatus | 'all';
    sort: 'oldest' | 'newest';
};

export type ReviewQueue = {
    items: ContributionReviewQueueItem[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    summary: {
        total: number;
        pending: number;
        approved: number;
        revision: number;
        rejected: number;
    };
};

export type CampusContributionsProps = {
    institution: {
        id: number;
        name: string;
    };
    filters: ReviewFilters;
    reviewQueue?: ReviewQueue;
};

export type ReviewPayload = {
    decision: ReviewDecision;
    expected_version: number;
    expected_revision: string;
    reason: string | null;
    note: string | null;
};

export type ErrorMap = Record<string, unknown>;

export const statusMeta: Record<
    ContributionStatus,
    { label: string; description: string; className: string }
> = {
    draft: {
        label: 'Draft',
        description: 'Belum dikirim untuk validasi.',
        className: 'border-border bg-accent/35 text-muted-foreground',
    },
    pending: {
        label: 'Menunggu validasi',
        description: 'Menunggu keputusan peninjau kampus.',
        className:
            'border-pending/30 bg-pending-subtle text-pending-subtle-foreground',
    },
    revision: {
        label: 'Perlu diperbaiki',
        description: 'Pemilik menerima catatan untuk membuat versi baru.',
        className:
            'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
    },
    approved: {
        label: 'Tervalidasi',
        description: 'Disetujui untuk versi kontribusi yang ditinjau.',
        className:
            'border-verified/30 bg-verified-subtle text-verified-subtle-foreground',
    },
    rejected: {
        label: 'Ditolak',
        description: 'Keputusan penolakan tersimpan di riwayat.',
        className:
            'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
    },
    archived: {
        label: 'Diarsipkan',
        description: 'Kontribusi tidak menerima keputusan baru.',
        className: 'border-border bg-accent/35 text-muted-foreground',
    },
};

export const decisionMeta: Record<
    ReviewDecision,
    { label: string; description: string; className: string }
> = {
    approved: {
        label: 'Setujui Kontribusi',
        description: 'Kontribusi valid dan dapat menjadi capaian portofolio.',
        className:
            'border-verified/30 bg-verified-subtle text-verified-subtle-foreground hover:bg-verified-subtle',
    },
    revision: {
        label: 'Minta Perbaikan',
        description:
            'Mahasiswa perlu membuat versi baru berdasarkan catatan peninjau.',
        className:
            'border-pending/30 bg-pending-subtle text-pending-subtle-foreground hover:bg-pending-subtle',
    },
    rejected: {
        label: 'Tolak Kontribusi',
        description: 'Tolak kontribusi dengan alasan tertulis faktual.',
        className:
            'border-correction/30 bg-correction-subtle text-correction-subtle-foreground hover:bg-correction-subtle',
    },
};

export function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Tanggal tidak tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function firstError(
    errors: ErrorMap,
    field: string,
): string | undefined {
    const value = errors[field];

    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : undefined;
    }

    return typeof value === 'string' ? value : undefined;
}

export type {
    ContributionApiResponse,
    ContributionReview,
    ContributionReviewQueueItem,
    ContributionStatus,
};
