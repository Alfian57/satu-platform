import { usePage } from '@inertiajs/react';
import { Building2, Clock3, LockKeyhole, ShieldAlert } from 'lucide-react';
import {
    activationNotice,
    isAffiliationAwaitingReview,
} from '@/lib/student-activation';
import { cn } from '@/lib/utils';
import type { ShellContext } from '@/types';
import type { StudentActivation } from '@/types/onboarding';

export function DashboardAffiliationNotice({ shell }: { shell: ShellContext }) {
    const membership = shell.institutionMembership;
    const { onboarding } = usePage<{
        onboarding?: StudentActivation | null;
        [key: string]: unknown;
    }>().props;
    const notice = activationNotice(onboarding);

    if (membership?.status === 'verified' && !notice.locked) {
        return null;
    }

    const status = notice.locked
        ? 'suspended'
        : membership?.status === 'verified'
          ? 'unverified'
          : (membership?.status ?? 'unverified');
    const details = {
        unverified: {
            icon: Building2,
            className: 'border-border bg-accent/60',
            iconClass: 'text-primary',
        },
        pending: {
            icon: Clock3,
            className: 'border-pending/30 bg-pending-subtle',
            iconClass: 'text-pending-subtle-foreground',
        },
        suspended: {
            icon: ShieldAlert,
            className: 'border-correction/30 bg-correction-subtle',
            iconClass: 'text-correction-subtle-foreground',
        },
    }[status];
    const Icon = details.icon;

    if (status === 'pending' && isAffiliationAwaitingReview(onboarding)) {
        return (
            <section
                aria-labelledby="dashboard-affiliation-heading"
                className="dashboard-affiliation-pending"
                data-test="dashboard-affiliation-explanation"
                data-affiliation-status={status}
            >
                <div className="dashboard-affiliation-pending__university">
                    <span className="dashboard-affiliation-pending__icon">
                        <Building2 aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                        <p>Afiliasi kampus</p>
                        {membership?.institutionName && (
                            <p>{membership.institutionName}</p>
                        )}
                    </div>
                </div>
                <h2 id="dashboard-affiliation-heading" tabIndex={-1}>
                    {notice.title}
                </h2>
                <p className="dashboard-affiliation-pending__description">
                    {notice.description}
                </p>
                <div className="dashboard-affiliation-pending__note">
                    <LockKeyhole aria-hidden="true" className="size-4" />
                    <p>
                        Penyimpanan profil dan akses kolaborasi menunggu
                        verifikasi.
                    </p>
                </div>
            </section>
        );
    }

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
                    {notice.title}
                </h2>
                {membership?.institutionName && (
                    <p className="mt-1 text-sm font-medium wrap-anywhere text-foreground">
                        {membership.institutionName}
                    </p>
                )}
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {notice.description}
                </p>
            </div>
        </section>
    );
}
