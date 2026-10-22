export type SupportEvent = {
    id: number;
    action: string;
    reason: string | null;
    created_at: string;
    opportunity: {
        project_id: number;
        project_title: string;
        role_title: string;
    } | null;
};

export type SupportCase = {
    id: number;
    need: string;
    explanation: string | null;
    owner_name: string;
    status: string;
    revision: number;
    created_at: string;
    expires_at: string;
    permissions: { review: boolean; respond: boolean; withdraw: boolean };
    events: SupportEvent[];
};

export type OpportunitySupportNotice = {
    purpose: string;
    version: string;
    access_days: number;
    dataset_kind: string;
    dataset_manifest: string;
} | null;

export type OpportunitySupportProps = {
    institution: { id: number; name: string };
    reviewer: boolean;
    enabled: boolean;
    can_create: boolean;
    notice: OpportunitySupportNotice;
    requests: {
        data: SupportCase[];
        page: number;
        last_page: number;
        total: number;
        installed: boolean;
    };
    opportunities: {
        id: number;
        label: string;
        accepts_beginners: boolean | null;
    }[];
    journey: null | {
        state: string;
        snapshot_at: string;
        denominator: number | null;
        metrics: {
            label: string;
            value: number | null;
            source: string;
            state?: string;
        }[];
    };
};

export const needs: Record<string, string> = {
    find_role: 'Menemukan peran yang relevan',
    beginner_path: 'Mencari peluang untuk pemula',
    application_help: 'Memahami cara mengajukan minat',
};

export const statuses: Record<string, string> = {
    requested: 'Menunggu tindak lanjut',
    offered: 'Ada tawaran peluang',
    accepted: 'Tawaran diterima',
    declined: 'Tawaran ditolak',
    withdrawn: 'Izin dicabut',
};

export const actions: Record<string, string> = {
    requested: 'Bantuan diajukan',
    offer: 'Peluang ditawarkan',
    accept: 'Tawaran diterima, belum bergabung',
    decline: 'Tawaran ditolak',
    note: 'Catatan tindak lanjut, bukan hasil terverifikasi',
    withdraw: 'Izin dicabut',
};

export const sheetClass =
    'min-w-0 rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6';

export function formatSupportDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
