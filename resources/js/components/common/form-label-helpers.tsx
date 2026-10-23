import { cn } from '@/lib/utils';

export function RequiredMark({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn('ml-1 font-bold text-destructive', className)}
        >
            *
        </span>
    );
}

export function OptionalMark({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'ml-1 text-xs font-normal text-muted-foreground',
                className,
            )}
        >
            (opsional)
        </span>
    );
}
