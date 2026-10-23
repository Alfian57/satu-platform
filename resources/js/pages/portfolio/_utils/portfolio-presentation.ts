import {
    CheckCircle2,
    CircleAlert,
    EyeOff,
    Globe2,
    LockKeyhole,
} from 'lucide-react';
import type {
    PortfolioEntryStatus,
    PortfolioVisibility,
} from '@/types/portfolio';

export { PortfolioStatusBadge } from '@/pages/portfolio/show/_components/portfolio-status-badge';
export { PortfolioVerificationBadge } from '@/pages/portfolio/show/_components/portfolio-verification-badge';

export const portfolioVisibilityOptions = [
    {
        value: 'private',
        label: 'Hanya saya',
        description: 'Simpan sebagai catatan pribadi, tanpa dibagikan.',
        icon: LockKeyhole,
    },
    {
        value: 'public',
        label: 'Publik',
        description:
            'Bagikan melalui halaman publik jika profil juga dipilih Publik.',
        icon: Globe2,
    },
] satisfies Array<{
    value: PortfolioVisibility;
    label: string;
    description: string;
    icon: typeof LockKeyhole;
}>;

export const portfolioStatusMeta: Record<
    PortfolioEntryStatus,
    {
        label: string;
        description: string;
        className: string;
        icon: typeof LockKeyhole;
    }
> = {
    private: {
        label: 'Tersimpan privat',
        description: 'Karya belum dibagikan. Pilih jangkauan jika sudah siap.',
        className: 'border-border bg-muted text-muted-foreground',
        icon: LockKeyhole,
    },
    published: {
        label: 'Dipilih Publik',
        description:
            'Karya dibagikan hanya jika profil juga Publik. Profil Hanya saya tetap menutup seluruh karya.',
        className:
            'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
        icon: CheckCircle2,
    },
    withdrawn: {
        label: 'Ditarik sementara',
        description:
            'Karya tidak sedang dibagikan. Periksa jangkauan sebelum menerbitkan kembali.',
        className:
            'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
        icon: EyeOff,
    },
    source_unavailable: {
        label: 'Sumber perlu diperiksa',
        description:
            'Sumber kontribusi perlu diperiksa sebelum karya dapat dibagikan.',
        className:
            'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
        icon: CircleAlert,
    },
};

export function portfolioVisibilityLabel(
    visibility: PortfolioVisibility,
): string {
    return (
        portfolioVisibilityOptions.find((option) => option.value === visibility)
            ?.label ?? 'Tidak tersedia'
    );
}

export function formatPortfolioDate(value: string | null): string {
    if (value === null) {
        return 'Belum tersedia';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Tanggal tidak tersedia'
        : new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeZone: 'UTC',
          }).format(date);
}
