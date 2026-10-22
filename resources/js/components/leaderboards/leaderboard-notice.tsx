import { CircleAlert, Info, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface LeaderboardNoticeProps {
    tone?: 'info' | 'warning' | 'error';
    title: string;
    children: ReactNode;
}

export function LeaderboardNotice({
    tone = 'info',
    title,
    children,
}: LeaderboardNoticeProps) {
    const Icon =
        tone === 'error'
            ? CircleAlert
            : tone === 'warning'
              ? Info
              : ShieldCheck;

    return (
        <div
            role={tone === 'error' ? 'alert' : 'status'}
            data-test={`leaderboard-notice-${tone}`}
            className={cn(
                'flex min-w-0 items-start gap-3 rounded-2xl border p-4 text-sm leading-6',
                tone === 'error'
                    ? 'border-correction/30 bg-correction-subtle text-correction-subtle-foreground'
                    : tone === 'warning'
                      ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                      : 'border-border bg-accent/60 text-foreground',
            )}
        >
            <Icon aria-hidden="true" className="mt-1 size-4 shrink-0" />
            <div className="min-w-0 [overflow-wrap:anywhere]">
                <p className="font-semibold">{title}</p>
                <div className="mt-1">{children}</div>
            </div>
        </div>
    );
}
