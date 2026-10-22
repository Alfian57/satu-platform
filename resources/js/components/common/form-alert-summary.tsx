import { CheckCircle2, CircleAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export interface FormAlertSummaryProps {
    errors?: Record<string, string | string[] | undefined> | string[];
    actionError?: string | null;
    actionErrorTitle?: string;
    success?: string | null;
    processing?: boolean;
    processingMessage?: string;
    title?: string;
    prefix?: string;
    errorHint?: string;
    className?: string;
}

function normalizeErrors(
    errors?: Record<string, string | string[] | undefined> | string[],
): string[] {
    if (!errors) {
        return [];
    }

    if (Array.isArray(errors)) {
        return errors.filter(Boolean);
    }

    const messages: string[] = [];

    for (const key of Object.keys(errors)) {
        const val = errors[key];

        if (typeof val === 'string' && val.trim().length > 0) {
            messages.push(val);
        } else if (Array.isArray(val)) {
            messages.push(
                ...val.filter(
                    (item): item is string =>
                        typeof item === 'string' && item.trim().length > 0,
                ),
            );
        }
    }

    return messages;
}

export function FormAlertSummary({
    errors,
    actionError,
    actionErrorTitle = 'Ada isian yang perlu diperiksa.',
    success,
    processing = false,
    processingMessage = 'Menyimpan perubahan...',
    prefix = 'form-alert',
    errorHint,
    className,
}: FormAlertSummaryProps) {
    const errorRef = useRef<HTMLDivElement>(null);
    const wasProcessing = useRef(false);

    const errorList = normalizeErrors(errors);
    const hasError = Boolean(actionError) || errorList.length > 0;

    useEffect(() => {
        if (wasProcessing.current && !processing && hasError) {
            errorRef.current?.focus();
        }

        wasProcessing.current = processing;
    }, [processing, hasError]);

    return (
        <div className={cn('grid min-w-0 gap-3', className)}>
            {processing && (
                <p
                    role="status"
                    aria-live="polite"
                    data-test={`${prefix}-processing`}
                    className="flex min-h-5 items-center gap-2 text-xs leading-5 text-muted-foreground"
                >
                    <Spinner className="size-3.5" />
                    <span>{processingMessage}</span>
                </p>
            )}

            {hasError && (
                <div
                    ref={errorRef}
                    tabIndex={-1}
                    role="alert"
                    aria-live="assertive"
                    id={`${prefix}-error`}
                    data-test={`${prefix}-error`}
                    className="flex min-w-0 items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 [overflow-wrap:anywhere] text-correction-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                    <CircleAlert
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                            {actionError
                                ? actionErrorTitle
                                : 'Ada isian yang perlu diperiksa.'}
                        </p>

                        {actionError ? (
                            <p className="mt-1 text-sm">{actionError}</p>
                        ) : (
                            <ul className="mt-2 list-inside list-disc space-y-1">
                                {errorList.map((msg, index) => (
                                    <li key={index}>{msg}</li>
                                ))}
                            </ul>
                        )}

                        {errorHint && (
                            <p className="mt-2 text-xs text-correction-subtle-foreground/90">
                                {errorHint}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {success && !hasError && !processing && (
                <div
                    role="status"
                    aria-live="polite"
                    id={`${prefix}-success`}
                    data-test={`${prefix}-success`}
                    className="flex min-w-0 items-start gap-3 rounded-2xl border border-verified/30 bg-verified-subtle p-4 text-sm leading-6 text-verified-subtle-foreground"
                >
                    <CheckCircle2
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <p>{success}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
