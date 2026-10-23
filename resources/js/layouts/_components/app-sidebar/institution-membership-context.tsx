import { Link } from '@inertiajs/react';
import { Building2, ChevronRight } from 'lucide-react';
import { WorkspaceContextCard } from '@/layouts/_components/workspace-context-card';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { InstitutionMembershipStatus, ShellContext } from '@/types';

const membershipStatuses: Record<
    InstitutionMembershipStatus,
    {
        label: string;
        badgeClass: string;
        dotClass: string;
    }
> = {
    unverified: {
        label: 'Belum terverifikasi',
        badgeClass: 'border-border/80 bg-muted/70 text-muted-foreground',
        dotClass: 'bg-muted-foreground/60',
    },
    pending: {
        label: 'Menunggu tinjauan',
        badgeClass:
            'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300 dark:border-amber-500/30',
        dotClass: 'bg-amber-500',
    },
    verified: {
        label: 'Terverifikasi',
        badgeClass:
            'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 dark:border-emerald-500/30',
        dotClass: 'bg-emerald-500',
    },
    suspended: {
        label: 'Akses ditangguhkan',
        badgeClass: 'border-destructive/25 bg-destructive/10 text-destructive',
        dotClass: 'bg-destructive',
    },
};

export function InstitutionMembershipContext({
    shell,
}: {
    shell: ShellContext;
}) {
    const membership = shell.institutionMembership;
    const status = membership ? membershipStatuses[membership.status] : null;
    const isActionable = membership?.status !== 'verified';

    const content = (
        <WorkspaceContextCard
            label="Afiliasi Kampus"
            showLabel={false}
            name={membership?.institutionName ?? 'Afiliasi belum diajukan'}
            icon={Building2}
            logoSrc={membership ? '/images/university-uty.webp' : undefined}
            actionIndicator={
                isActionable ? (
                    <ChevronRight className="size-4 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                ) : undefined
            }
        >
            {status && (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.6875rem] leading-tight font-medium shadow-none',
                        status.badgeClass,
                    )}
                >
                    <span
                        className={cn(
                            'size-1.5 shrink-0 rounded-full',
                            status.dotClass,
                        )}
                    />
                    {status.label}
                </span>
            )}
        </WorkspaceContextCard>
    );

    return isActionable ? (
        <Link
            href={dashboard()}
            className="group block cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label={
                membership
                    ? `Buka status afiliasi ${membership.institutionName}`
                    : 'Buka aktivasi afiliasi universitas'
            }
        >
            {content}
        </Link>
    ) : (
        content
    );
}
