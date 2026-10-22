import { Link } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WorkspaceContextCard } from '@/components/workspace-context-card';
import { dashboard } from '@/routes';
import type { InstitutionMembershipStatus, ShellContext } from '@/types';

const membershipStatuses: Record<
    InstitutionMembershipStatus,
    {
        label: string;
        variant: 'secondary' | 'verified' | 'pending' | 'correction';
    }
> = {
    unverified: { label: 'Belum terverifikasi', variant: 'secondary' },
    pending: { label: 'Menunggu tinjauan', variant: 'pending' },
    verified: { label: 'Terverifikasi', variant: 'verified' },
    suspended: { label: 'Akses ditangguhkan', variant: 'correction' },
};

export function InstitutionMembershipContext({
    shell,
}: {
    shell: ShellContext;
}) {
    const membership = shell.institutionMembership;
    const status = membership ? membershipStatuses[membership.status] : null;
    const content = (
        <WorkspaceContextCard
            label="Universitas"
            showLabel={false}
            name={membership?.institutionName ?? 'Afiliasi belum diajukan'}
            icon={Building2}
            logoSrc={membership ? '/images/university-uty.webp' : undefined}
        >
            {status && (
                <Badge
                    variant={status.variant}
                    className="max-w-full whitespace-normal"
                >
                    {status.label}
                </Badge>
            )}
        </WorkspaceContextCard>
    );

    return membership?.status === 'verified' ? (
        content
    ) : (
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
    );
}
