import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p
            {...props}
            className={cn(
                'text-xs leading-normal font-medium text-destructive dark:text-destructive',
                className,
            )}
        >
            {message}
        </p>
    ) : null;
}
