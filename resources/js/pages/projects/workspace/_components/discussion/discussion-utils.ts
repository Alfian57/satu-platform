import type { WorkspaceAttachment, WorkspaceDiscussion } from '@/types/task';

export type ErrorMap = Record<string, unknown>;

export const ACCEPTED_FILE_TYPES =
    '.csv,.doc,.docx,.jpg,.jpeg,.pdf,.png,.ppt,.pptx,.txt,.webp,.xls,.xlsx';

export type PendingUpload = {
    file: File;
    messageId: number;
    status: 'uploading' | 'failed';
    error: string | null;
};

export type DiscussionFormData = {
    body: string;
};

export type DiscussionQueryData = {
    page?: number;
    per_page?: number;
};

export type UploadFormData = {
    file: File | null;
    message_id: number | null;
    purpose: 'evidence';
};

export type MessageResponse = {
    data: WorkspaceDiscussion;
};

export type AttachmentResponse = {
    data: WorkspaceAttachment;
};

export function formatFileSize(sizeBytes: number): string {
    if (sizeBytes < 1024) {
        return `${sizeBytes} B`;
    }

    if (sizeBytes < 1024 * 1024) {
        return `${Math.round(sizeBytes / 1024)} KB`;
    }

    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDateTime(value: string | null): string {
    if (value === null) {
        return 'Belum ditentukan';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

export function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
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
