import { CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { statusLabels } from '@/components/campus/integrations/integration-types';
import { cn } from '@/lib/utils';

export function IntegrationStatusBadge({ status }: { status: string }) {
    const verified = status === 'succeeded' || status === 'reconciled';
    const waiting =
        status === 'queued' || status === 'sending' || status === 'retrying';
    const Icon = verified ? CheckCircle2 : waiting ? Clock : ShieldAlert;

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                verified
                    ? 'border-verified/30 bg-verified-subtle text-verified-subtle-foreground'
                    : waiting
                      ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                      : 'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
            )}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {statusLabels[status] ?? status}
        </span>
    );
}
