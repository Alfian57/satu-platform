import { cn } from '@/lib/utils';

export default function RequiredMark({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'auth-required-marker ml-1 font-bold text-destructive',
                className,
            )}
        >
            *
        </span>
    );
}
