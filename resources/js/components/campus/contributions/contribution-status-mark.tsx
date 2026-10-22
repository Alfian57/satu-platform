import { AlertTriangle, CheckCircle2, CircleDot, Clock3 } from 'lucide-react';
import type { ContributionStatus } from '@/components/campus/contributions/contribution-types';

interface ContributionStatusMarkProps {
    status: ContributionStatus;
}

export function ContributionStatusMark({
    status,
}: ContributionStatusMarkProps) {
    if (status === 'approved') {
        return <CheckCircle2 aria-hidden="true" className="size-3.5" />;
    }

    if (status === 'pending') {
        return <Clock3 aria-hidden="true" className="size-3.5" />;
    }

    if (status === 'revision' || status === 'rejected') {
        return <AlertTriangle aria-hidden="true" className="size-3.5" />;
    }

    return <CircleDot aria-hidden="true" className="size-3.5" />;
}
