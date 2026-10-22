import { ContributionStatusMark } from '@/components/campus/contributions/contribution-status-mark';
import { statusMeta } from '@/components/campus/contributions/contribution-types';
import type { ContributionStatus } from '@/components/campus/contributions/contribution-types';
import { cn } from '@/lib/utils';

interface ContributionStatusChipProps {
    status: ContributionStatus;
}

export function ContributionStatusChip({
    status,
}: ContributionStatusChipProps) {
    const meta = statusMeta[status];

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                meta.className,
            )}
        >
            <ContributionStatusMark status={status} />
            {meta.label}
        </span>
    );
}
