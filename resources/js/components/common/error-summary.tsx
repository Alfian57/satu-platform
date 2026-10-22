import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ErrorSummaryProps {
    errors: Record<string, string | string[] | undefined> | string[];
    title?: string;
    hint?: string | ReactNode;
    autoFocus?: boolean;
    id?: string;
    className?: string;
}

function extractErrorList(
    errors: Record<string, string | string[] | undefined> | string[],
): string[] {
    if (Array.isArray(errors)) {
        return errors.filter(Boolean);
    }

    const messages: string[] = [];

    for (const key of Object.keys(errors)) {
        const value = errors[key];

        if (typeof value === 'string' && value.trim().length > 0) {
            messages.push(value);
        } else if (Array.isArray(value)) {
            messages.push(
                ...value.filter(
                    (item): item is string =>
                        typeof item === 'string' && item.trim().length > 0,
                ),
            );
        }
    }

    return messages;
}

export function ErrorSummary({
    errors,
    title = 'Terdapat kesalahan pada formulir',
    hint,
    autoFocus = true,
    id = 'error-summary',
    className,
}: ErrorSummaryProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const messages = extractErrorList(errors);

    useEffect(() => {
        if (autoFocus && messages.length > 0) {
            containerRef.current?.focus();
        }
    }, [autoFocus, messages.length]);

    if (messages.length === 0) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            id={id}
            tabIndex={-1}
            role="alert"
            aria-live="assertive"
            data-slot="error-summary"
            className={cn(
                'flex min-w-0 items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 [overflow-wrap:anywhere] text-correction-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                className,
            )}
        >
            <CircleAlert aria-hidden="true" className="mt-1 size-5 shrink-0" />
            <div className="min-w-0 flex-1">
                <h4 className="text-base leading-snug font-semibold">
                    {title}
                </h4>
                <ul className="mt-2 list-inside list-disc space-y-1">
                    {messages.map((error, index) => (
                        <li key={index} className="text-sm">
                            {error}
                        </li>
                    ))}
                </ul>
                {hint && (
                    <div className="mt-3 text-xs text-correction-subtle-foreground/80">
                        {hint}
                    </div>
                )}
            </div>
        </div>
    );
}
