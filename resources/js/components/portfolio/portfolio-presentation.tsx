import {
    CheckCircle2,
    CircleAlert,
    EyeOff,
    FileText,
    Globe2,
    LockKeyhole,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
    PortfolioEntry,
    PortfolioEntryStatus,
    PortfolioVisibility,
} from '@/types/portfolio';

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

export function PortfolioStatusBadge({
    status,
}: {
    status: PortfolioEntryStatus;
}) {
    const meta = portfolioStatusMeta[status];
    const Icon = meta.icon;

    return (
        <span
            className={cn(
                'inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                meta.className,
            )}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {meta.label}
        </span>
    );
}

export function PortfolioVerificationBadge({
    entry,
    className,
}: {
    entry: Pick<PortfolioEntry, 'verification_level' | 'verification_label'>;
    className?: string;
}) {
    const Icon =
        entry.verification_level === 'institution_verified'
            ? ShieldCheck
            : entry.verification_level === 'team_confirmed'
              ? UsersRound
              : FileText;

    return (
        <span
            className={cn(
                'inline-flex w-fit max-w-full min-w-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                entry.verification_level === 'institution_verified'
                    ? 'border-verified/30 bg-verified-subtle text-verified-subtle-foreground'
                    : 'border-border bg-muted text-muted-foreground',
                className,
            )}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="min-w-0 [overflow-wrap:anywhere]">
                {entry.verification_label}
            </span>
        </span>
    );
}
