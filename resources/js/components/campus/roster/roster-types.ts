export interface Institution {
    id: number;
    name: string;
}

export interface RosterHistoryItem {
    id: number;
    semester: string;
    sourceFilename: string;
    status: 'active' | 'superseded';
    totalRows: number;
    validRows: number;
    errorRows: number;
    rowsCount: number;
    activatedAt: string | null;
    supersededAt: string | null;
}

export interface RosterPreview {
    semester: string;
    total_rows: number;
    valid_rows: number;
    error_rows: number;
    errors: Array<{
        row: number;
        errors: Record<string, string[]>;
    }>;
    preview: Array<{
        nim: string;
        nama: string;
        program_studi: string;
        angkatan: string;
        semester: string;
        is_active: boolean;
    }>;
}

export interface RosterImportProps {
    institution: Institution;
    rosters: RosterHistoryItem[];
    preview?: RosterPreview;
}

export const rosterStatus = {
    active: {
        label: 'Aktif',
        className:
            'border-verified/30 bg-verified-subtle text-verified-subtle-foreground',
    },
    superseded: {
        label: 'Digantikan',
        className: 'border-border bg-accent/35 text-muted-foreground',
    },
};

export function formatDate(value: string | null): string {
    if (value === null || Number.isNaN(new Date(value).getTime())) {
        return 'Belum tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
