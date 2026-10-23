export interface CreditMappingItem {
    id: number;
    activity_type: string;
    version: number;
    credit_amount: number;
    status: string;
    effective_from: string | null;
    effective_to: string | null;
    approver_name: string | null;
    reason: string | null;
    created_at: string;
}

export interface CampusCreditMappingsProps {
    mappings: CreditMappingItem[];
    institution: {
        id: number;
        name: string;
    };
}

export const activityLabels: Record<string, string> = {
    project: 'Proyek terverifikasi',
    competition: 'Kompetisi / hackathon',
    research: 'Riset akademik',
    organization: 'Kepemimpinan organisasi mahasiswa',
};

export function mappingDate(value: string | null): string {
    if (!value || Number.isNaN(new Date(value).getTime())) {
        return 'Belum tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
        new Date(value),
    );
}
