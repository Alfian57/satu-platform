import type {
    ContributionDetail,
    ContributionProvenanceEvent,
    ContributionReview,
    ContributionStatus,
} from '@/types/contribution';

export type ErrorMap = Record<string, unknown>;

export const textAreaClassName =
    'min-h-28 min-w-0 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger placeholder:text-muted-foreground hover:border-ring focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

export const selectClassName =
    'h-11 min-w-0 w-full cursor-pointer rounded-xl border border-input bg-background pl-4 pr-10 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-ring focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50';

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

export function formatDateUtc(value: string): string {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Tanggal tidak tersedia'
        : new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeZone: 'UTC',
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

export function verificationLabel(status: ContributionStatus): string {
    return status === 'approved'
        ? 'Terverifikasi kampus'
        : 'Dilaporkan sendiri';
}

export function reviewMeta(decision: ContributionReview['decision']): {
    label: string;
    className: string;
} {
    if (decision === 'approved') {
        return {
            label: 'Tervalidasi',
            className:
                'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
        };
    }

    if (decision === 'revision') {
        return {
            label: 'Perlu diperbaiki',
            className:
                'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
        };
    }

    return {
        label: 'Ditolak',
        className:
            'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
    };
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

export function provenanceDecisionLabel(
    decision: ContributionProvenanceEvent['decision'],
): string {
    return {
        approved: 'Disetujui',
        revision: 'Perlu revisi',
        rejected: 'Belum disetujui',
    }[decision ?? 'rejected'];
}

export function portfolioOutcomeLabel(
    status: NonNullable<
        ContributionDetail['provenance']['portfolio']
    >['status'],
): string {
    return {
        private: 'Tersimpan privat',
        published: 'Terbit sesuai pengaturan visibilitas',
        withdrawn: 'Ditarik sementara',
        source_unavailable: 'Sumber perlu diperiksa',
    }[status];
}

export function defaultDeclaration(): string {
    return 'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.';
}
