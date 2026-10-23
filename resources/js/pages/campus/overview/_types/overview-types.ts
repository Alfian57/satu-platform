export interface OverviewMetrics {
    memberships: {
        total: number;
        verified: number;
        pending: number;
        unverified: number;
    };
    projects: {
        total: number;
        active: number;
        completed: number;
        draft: number;
    };
    contributions: {
        total: number;
        pending: number;
        validated: number;
        revision_required: number;
    };
    review_turnaround: {
        average_hours: number;
        total_reviewed: number;
        approved_count: number;
        rejected_count: number;
        revision_count: number;
    };
}

export interface MemberItem {
    id: number;
    role: string;
    status: string;
    program: string | null;
    createdAt: string | null;
}

export interface CampusOverviewProps {
    institution: { id: number; name: string };
    metrics: OverviewMetrics;
    programDistribution: { program: string; count: number }[];
    members: {
        items: MemberItem[];
        pagination: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    filters: {
        date_from: string | null;
        date_to: string | null;
        program: string | null;
    };
}

export type OverviewQuery = {
    date_from?: string;
    date_to?: string;
    program?: string;
    page: number;
    per_page: number;
};

export type ChartSegment = { label: string; value: number; color: string };

export const numberFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
});

export function formatDate(value: string | null): string {
    const date = value ? new Date(value) : null;

    return date && !Number.isNaN(date.getTime())
        ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date)
        : 'Belum tersedia';
}

export function roleLabel(role: string): string {
    if (role === 'campus_admin') {
        return 'Admin Universitas';
    }

    if (role === 'student') {
        return 'Mahasiswa';
    }

    return 'Peran lainnya';
}
