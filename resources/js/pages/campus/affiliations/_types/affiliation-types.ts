export type MatchResult =
    | 'exact'
    | 'no_match'
    | 'ambiguous'
    | 'inactive'
    | 'roster_unavailable'
    | 'stale_roster';

export type Decision = 'approve' | 'request_revision' | 'reject';

export type ReasonCode =
    | 'records_confirmed'
    | 'nim_correction_required'
    | 'phone_correction_required'
    | 'supporting_evidence_required'
    | 'not_affiliated';

export type ReviewItem = {
    id: number;
    nim: string;
    phone: string | null;
    matchResult: MatchResult;
    status: 'pending_review';
    version: number;
    submittedAt: string;
    isStale: boolean;
    rosterSemester: string | null;
    lock: {
        ownedByCurrentUser: boolean;
        expiresAt: string | null;
    } | null;
};

export type ReviewQueue = {
    items: ReviewItem[];
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    summary: {
        total: number;
        stale: number;
        exact: number;
        mismatch: number;
    };
    activeRoster: {
        semester: string;
        activatedAt: string | null;
    } | null;
};

export type Filters = {
    match: MatchResult | null;
    stale: boolean | null;
    sort: 'oldest' | 'newest';
};

export type CampusAffiliationsProps = {
    institution: {
        id: number;
        name: string;
    };
    filters: Filters;
    reviewQueue?: ReviewQueue;
    reviewOutcome: 'lock_acquired' | 'lock_released' | 'decision_saved' | null;
    reviewIssue: 'lock_conflict' | 'stale_decision' | null;
};

export const matchCopy: Record<MatchResult, string> = {
    exact: 'Cocok persis',
    no_match: 'Tidak ditemukan',
    ambiguous: 'Perlu konfirmasi',
    inactive: 'Status tidak aktif',
    roster_unavailable: 'Roster belum tersedia',
    stale_roster: 'Roster berubah',
};

export const matchClassName: Record<MatchResult, string> = {
    exact: 'border-verified/20 bg-verified-subtle text-verified-subtle-foreground',
    no_match:
        'border-correction/20 bg-correction-subtle text-correction-subtle-foreground',
    ambiguous:
        'border-pending/20 bg-pending-subtle text-pending-subtle-foreground',
    inactive:
        'border-correction/20 bg-correction-subtle text-correction-subtle-foreground',
    roster_unavailable: 'border-border bg-background text-muted-foreground',
    stale_roster:
        'border-correction/20 bg-correction-subtle text-correction-subtle-foreground',
};

export const decisionCopy: Record<Decision, string> = {
    approve: 'Setujui afiliasi',
    request_revision: 'Minta perbaikan',
    reject: 'Tolak afiliasi',
};

export const reasonsByDecision: Record<
    Decision,
    Array<{ value: ReasonCode; label: string }>
> = {
    approve: [{ value: 'records_confirmed', label: 'Data sudah dikonfirmasi' }],
    request_revision: [
        { value: 'nim_correction_required', label: 'NIM perlu diperbaiki' },
        {
            value: 'phone_correction_required',
            label: 'Nomor WhatsApp perlu diperbaiki',
        },
        {
            value: 'supporting_evidence_required',
            label: 'Bukti pendukung diperlukan',
        },
    ],
    reject: [{ value: 'not_affiliated', label: 'Tidak terafiliasi' }],
};

export const outcomeCopy: Record<
    NonNullable<CampusAffiliationsProps['reviewOutcome']>,
    string
> = {
    lock_acquired: 'Berkas review sudah dikunci untukmu selama 30 menit.',
    lock_released: 'Kunci review sudah dilepas.',
    decision_saved: 'Keputusan tersimpan dan riwayat audit sudah diperbarui.',
};

export function formatDate(value: string | null): string {
    if (!value || Number.isNaN(new Date(value).getTime())) {
        return 'Belum tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export const controlClassName =
    'h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-white px-3 text-base text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50';
