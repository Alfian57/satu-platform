import { cn } from '@/lib/utils';

export default function RequiredMark({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'auth-required-marker font-bold text-satu-orange-ink',
                className,
            )}
        >
            *
        </span>
    );
}
