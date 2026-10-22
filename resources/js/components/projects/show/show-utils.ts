import {
    Archive,
    CheckCircle2,
    Circle,
    CircleDot,
    CircleX,
    Clock3,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
    ProjectDetail,
    ProjectStatus,
    ProjectVisibility,
    TeamFormationState,
} from '@/types/project';

export type TransitionAction = 'cancel' | 'archive';

export type ProjectShowProps = {
    project: ProjectDetail;
    team: TeamFormationState;
    can_edit: boolean;
    can_transition: boolean;
    can_workspace: boolean;
};

export const statusLabels: Record<ProjectStatus, string> = {
    draft: 'Draft',
    open: 'Terbuka',
    forming: 'Membentuk tim',
    full: 'Kapasitas penuh',
    closed: 'Ditutup',
    cancelled: 'Dibatalkan',
    archived: 'Diarsipkan',
};

export const statusDescriptions: Record<ProjectStatus, string> = {
    draft: 'Proyek belum dibuka untuk permintaan kolaborasi.',
    open: 'Proyek menerima mahasiswa yang sesuai dengan kebutuhan tim.',
    forming: 'Proyek sedang membentuk tim dengan slot yang tersedia.',
    full: 'Kapasitas proyek sudah penuh untuk saat ini.',
    closed: 'Proyek tidak lagi menerima tindakan baru.',
    cancelled:
        'Proyek dibatalkan oleh pemilik dan tidak menerima tindakan baru.',
    archived:
        'Proyek disimpan sebagai riwayat dan tidak menerima tindakan baru.',
};

export const visibilityLabels: Record<ProjectVisibility, string> = {
    private: 'Pribadi milikmu',
    institution: 'Kampus',
    public: 'Publik',
};

export const statusIcons: Record<ProjectStatus, LucideIcon> = {
    draft: CircleDot,
    open: CheckCircle2,
    forming: Clock3,
    full: UsersRound,
    closed: Circle,
    cancelled: CircleX,
    archived: Archive,
};

export const statusClasses: Record<ProjectStatus, string> = {
    draft: 'border-border bg-muted text-muted-foreground',
    open: 'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
    forming:
        'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    full: 'border-border bg-muted text-muted-foreground',
    closed: 'border-border bg-muted text-muted-foreground',
    cancelled:
        'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
    archived: 'border-border bg-muted text-muted-foreground',
};

export const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
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
    const date = new Date(deadline);

    return Number.isNaN(date.getTime())
        ? 'Tanggal belum tersedia'
        : dateFormatter.format(date);
}

export function actionAvailability(project: ProjectDetail): string {
    const status = project.status as ProjectStatus;

    if (status === 'draft') {
        return 'Buka proyek setelah kebutuhan tim dan batas waktu siap.';
    }

    if (status === 'open' || status === 'forming' || status === 'full') {
        return 'Proyek sedang berjalan. Aksi buka ulang tidak tersedia pada status ini.';
    }

    if (status === 'closed' || status === 'cancelled') {
        return 'Proyek hanya dapat diarsipkan sebagai riwayat.';
    }

    return 'Proyek ini bersifat baca-saja karena status proyek sudah selesai.';
}
