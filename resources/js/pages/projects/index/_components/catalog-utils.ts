import {
    CheckCircle2,
    Circle,
    CircleDot,
    CircleX,
    Clock3,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CapacityStats } from '@/lib/project-opportunities';

export type ProjectStatus =
    'draft' | 'open' | 'forming' | 'full' | 'closed' | 'cancelled' | 'archived';

export type ProjectVisibility = 'private' | 'institution' | 'public';

export type ProjectRole = {
    id: number;
    title: string;
    description: string | null;
    capacity: number;
    accepts_beginners?: boolean | null;
    selection_criteria?: string | null;
    capacity_stats?: CapacityStats;
    skills: {
        id: number;
        name: string;
        proficiency: string;
    }[];
};

export type ProjectSummary = {
    id: number;
    institution_id: number;
    institution: {
        id: number;
        name: string;
    };
    owner_id: number;
    owner: {
        id: number;
        name: string;
    };
    title: string;
    description: string | null;
    status: ProjectStatus | string;
    visibility: ProjectVisibility | string;
    capacity: number;
    deadline: string;
    capacity_stats?: CapacityStats;
    roles: ProjectRole[];
    created_at: string;
    updated_at: string;
};

export type ProjectPagination = {
    data: ProjectSummary[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
};

export type DiscoveryFilters = {
    view: 'opportunities' | 'mine';
    beginner?: 'all' | 'accepting';
    availability?: 'all' | 'available';
    q: string;
    status: string[];
    visibility: string[];
    sort: string;
    direction: string;
    institution_id: number;
    per_page: number;
    page: number;
};

export type FilterOptions = {
    status: string[];
    visibility: string[];
    sort: string[];
    direction: string[];
    per_page: {
        default: number;
        max: number;
    };
};

export type ProjectIndexProps = {
    institution: {
        id: number;
        name: string;
    };
    projects: ProjectPagination;
    filters: DiscoveryFilters;
    filter_options: FilterOptions;
};

export const statusLabels: Record<ProjectStatus, string> = {
    draft: 'Draft',
    archived: 'Diarsipkan',
    open: 'Terbuka',
    forming: 'Membentuk tim',
    full: 'Kapasitas penuh',
    closed: 'Ditutup',
    cancelled: 'Dibatalkan',
};

export const visibilityLabels: Record<ProjectVisibility, string> = {
    private: 'Privat',
    institution: 'Kampus',
    public: 'Publik',
};

export const statusIcons: Record<ProjectStatus, LucideIcon> = {
    draft: CircleDot,
    archived: Circle,
    open: CheckCircle2,
    forming: Clock3,
    full: UsersRound,
    closed: Circle,
    cancelled: CircleX,
};

export const statusClasses: Record<ProjectStatus, string> = {
    draft: 'border-border bg-muted text-muted-foreground',
    archived: 'border-border bg-muted text-muted-foreground',
    open: 'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
    forming:
        'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    full: 'border-border bg-muted text-muted-foreground',
    closed: 'border-border bg-muted text-muted-foreground',
    cancelled:
        'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
};

export const selectClassName =
    'h-11 min-w-0 w-full cursor-pointer rounded-xl border border-input bg-card pl-4 pr-10 text-base text-foreground transition-colors duration-fast hover:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

export const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
});

export function displayStatus(status: string): string {
    return statusLabels[status as ProjectStatus] ?? status;
}

export function displayVisibility(visibility: string): string {
    return visibilityLabels[visibility as ProjectVisibility] ?? visibility;
}

export function displayProficiency(proficiency: string): string {
    const labels: Record<string, string> = {
        beginner: 'Pemula',
        intermediate: 'Menengah',
        advanced: 'Mahir',
        expert: 'Ahli',
    };

    return labels[proficiency] ?? proficiency;
}

export function formatDeadline(deadline: string): string {
    const dateParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(deadline);
    const date = dateParts
        ? new Date(
              Date.UTC(
                  Number(dateParts[1]),
                  Number(dateParts[2]) - 1,
                  Number(dateParts[3]),
              ),
          )
        : new Date(deadline);

    return Number.isNaN(date.getTime())
        ? 'Tanggal belum tersedia'
        : dateFormatter.format(date);
}

export function pageNumbers(currentPage: number, lastPage: number): number[] {
    const windowSize = 5;
    const end = Math.min(lastPage, Math.max(currentPage + 2, windowSize));
    const start = Math.max(1, Math.min(currentPage - 2, end - windowSize + 1));

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
