import type { LucideIcon } from 'lucide-react';
import {
    CheckCircle2,
    CircleAlert,
    CircleDot,
    Clock3,
    Info,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

export type StatusTone =
    'verified' | 'pending' | 'correction' | 'neutral' | 'primary';

export interface StatusBadgeProps {
    status?: string;
    tone?: StatusTone;
    label?: string;
    description?: string;
    icon?:
        | LucideIcon
        | ComponentType<{
              className?: string;
              'aria-hidden'?: boolean | 'true' | 'false';
          }>
        | null;
    size?: 'sm' | 'md';
    className?: string;
}

const toneStyles: Record<StatusTone, string> = {
    verified:
        'border-verified/30 bg-verified-subtle text-verified-subtle-foreground',
    pending:
        'border-pending/30 bg-pending-subtle text-pending-subtle-foreground',
    correction:
        'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
    neutral: 'border-border bg-muted text-muted-foreground',
    primary: 'border-primary/20 bg-accent text-accent-foreground',
};

const defaultToneIcons: Record<StatusTone, LucideIcon> = {
    verified: CheckCircle2,
    pending: Clock3,
    correction: CircleAlert,
    neutral: CircleDot,
    primary: Info,
};

function resolveStatusTone(status?: string): StatusTone {
    if (!status) {
        return 'neutral';
    }

    const normalized = status.toLowerCase();

    if (
        [
            'verified',
            'approved',
            'active',
            'published',
            'exact',
            'completed',
            'institution_verified',
            'team_confirmed',
        ].includes(normalized)
    ) {
        return 'verified';
    }

    if (
        [
            'pending',
            'waiting',
            'in_review',
            'pending_review',
            'withdrawn',
            'locked',
            'submitted',
        ].includes(normalized)
    ) {
        return 'pending';
    }

    if (
        [
            'correction',
            'rejected',
            'revision',
            'suspended',
            'error',
            'failed',
            'source_unavailable',
            'ambiguous',
            'missing',
        ].includes(normalized)
    ) {
        return 'correction';
    }

    return 'neutral';
}

function formatStatusLabel(status?: string): string {
    if (!status) {
        return 'Status tidak diketahui';
    }

    return status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StatusBadge({
    status,
    tone,
    label,
    description,
    icon,
    size = 'md',
    className,
}: StatusBadgeProps) {
    const effectiveTone = tone ?? resolveStatusTone(status);
    const effectiveLabel = label ?? formatStatusLabel(status);
    const IconComponent =
        icon === null ? null : (icon ?? defaultToneIcons[effectiveTone]);

    return (
        <span
            data-slot="status-badge"
            data-tone={effectiveTone}
            title={description}
            className={cn(
                'inline-flex w-fit max-w-full shrink-0 items-center rounded-full border font-semibold whitespace-nowrap transition-colors',
                size === 'sm'
                    ? 'gap-1 px-2 py-0.5 text-[11px] leading-4'
                    : 'gap-1.5 px-3 py-1 text-xs leading-5',
                toneStyles[effectiveTone],
                className,
            )}
        >
            {IconComponent && (
                <IconComponent
                    aria-hidden="true"
                    className={cn(
                        'shrink-0',
                        size === 'sm' ? 'size-3' : 'size-3.5',
                    )}
                />
            )}
            <span className="truncate">{effectiveLabel}</span>
        </span>
    );
}
