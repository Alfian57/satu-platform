import { Building2, Clock3, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShellContext } from '@/types';

export function DashboardAffiliationNotice({ shell }: { shell: ShellContext }) {
    const membership = shell.institutionMembership;

    if (membership?.status === 'verified') {
        return null;
    }

    const status = membership?.status ?? 'unverified';
    const details = {
        unverified: {
            title: 'Hubungkan akunmu dengan kampus',
            description:
                'Menu Proyek, Kontribusi, Portofolio, dan Peringkat tersedia setelah afiliasi kampus terverifikasi. Lengkapi data kampus melalui pelengkapan profil.',
            icon: Building2,
            className: 'border-border bg-accent/60',
            iconClass: 'text-primary',
        },
        pending: {
            title: 'Afiliasi kampus menunggu tinjauan',
            description:
                'Kampus sedang meninjau afiliasimu. Selama menunggu, menu kolaborasi belum tersedia. Gunakan tindakan pemeriksaan status yang tersedia pada pelengkapan profil.',
            icon: Clock3,
            className: 'border-pending/30 bg-pending-subtle',
            iconClass: 'text-pending-subtle-foreground',
        },
        suspended: {
            title: 'Akses kampus sedang ditangguhkan',
            description:
                'Menu kolaborasi tidak tersedia selama akses kampus ditangguhkan. Ikuti informasi status dan langkah utama yang tersedia di beranda.',
            icon: ShieldAlert,
            className: 'border-correction/30 bg-correction-subtle',
            iconClass: 'text-correction-subtle-foreground',
        },
    }[status];
    const Icon = details.icon;

    return (
        <section
            aria-labelledby="dashboard-affiliation-heading"
            className={cn(
                'flex gap-3 rounded-3xl border p-5',
                details.className,
            )}
            data-test="dashboard-affiliation-explanation"
            data-affiliation-status={status}
        >
            <Icon
                aria-hidden="true"
                className={cn('mt-0.5 size-5 shrink-0', details.iconClass)}
            />
            <div className="min-w-0">
                <h2
                    id="dashboard-affiliation-heading"
                    className="text-sm font-bold text-foreground"
                >
                    {details.title}
                </h2>
                {membership?.institutionName && (
                    <p className="mt-1 text-sm font-medium wrap-anywhere text-foreground">
                        {membership.institutionName}
                    </p>
                )}
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {details.description}
                </p>
            </div>
        </section>
    );
}
