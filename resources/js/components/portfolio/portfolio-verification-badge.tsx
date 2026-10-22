import { FileText, ShieldCheck, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortfolioEntry } from '@/types/portfolio';

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
