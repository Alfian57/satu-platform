export interface TimelineEntry {
    status: string;
    reason: string | null;
    created_at: string;
}

export interface SyncItem {
    id: number;
    connection_id: number;
    connection_provider: string | null;
    source: string;
    mapping_version: string;
    idempotency_key: string;
    payload_digest_short: string;
    status: string;
    attempts: number;
    external_reference: string | null;
    last_attempt_at: string | null;
    created_at: string;
    error: string | null;
    timeline: TimelineEntry[];
}

export interface ConnectionItem {
    id: number;
    institution_id: number;
    provider_key: string;
    mode: 'sandbox' | 'real';
    mode_label: string;
    status: string;
    status_label: string;
    sync_count: number;
    created_at: string;
}

export interface SyncsPaginated {
    data: SyncItem[];
    links: string[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface AcademicIntegrationsProps {
    institution: {
        id: number;
        name: string;
    } | null;
    connections: ConnectionItem[];
    syncs: SyncsPaginated;
    filters: {
        status: string;
        connection: number;
        status_options: { value: string; label: string }[];
        connection_options: { id: number; label: string }[];
    };
    forbidden: boolean;
}

export const retryableStatuses = new Set([
    'failed',
    'retrying',
    'dead',
    'timeout',
    'validation_error',
    'conflict',
]);

export const reconcilableStatuses = new Set([
    'dead',
    'conflict',
    'timeout',
    'failed',
]);

export const statusLabels: Record<string, string> = {
    queued: 'Dalam antrean',
    sending: 'Sedang dikirim',
    succeeded: 'Berhasil',
    failed: 'Gagal',
    retrying: 'Mencoba ulang',
    dead: 'Percobaan dihentikan',
    timeout: 'Waktu habis',
    validation_error: 'Validasi gagal',
    conflict: 'Konflik',
    reconciled: 'Direkonsiliasi',
};

export function formatSyncDate(value: string | null) {
    if (!value || Number.isNaN(new Date(value).getTime())) {
        return 'Belum tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
