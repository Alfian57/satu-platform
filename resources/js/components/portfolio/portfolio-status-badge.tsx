import { cn } from '@/lib/utils';
import type { PortfolioEntryStatus } from '@/types/portfolio';
import { portfolioStatusMeta } from './portfolio-presentation';

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
