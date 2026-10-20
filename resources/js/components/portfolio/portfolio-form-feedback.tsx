import { CheckCircle2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

export type PortfolioErrorMap = Record<string, unknown>;

export function portfolioFieldError(
    errors: PortfolioErrorMap,
    field: string,
): string | null {
    const value = errors[field];

    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : null;
    }

    return typeof value === 'string' ? value : null;
}

export function PortfolioFormFeedback({
    errors,
    actionError,
    actionMessage,
    processing,
    processingMessage,
    prefix,
    uncertain = false,
}: {
    errors: PortfolioErrorMap;
    actionError: string | null;
    actionMessage: string | null;
    processing: boolean;
    processingMessage: string;
    prefix: string;
    uncertain?: boolean;
}) {
    const errorRef = useRef<HTMLDivElement>(null);
    const wasProcessing = useRef(false);
    const messages = Object.keys(errors)
        .map((key) => portfolioFieldError(errors, key))
        .filter((message): message is string => Boolean(message));
    const hasError = Boolean(actionError) || messages.length > 0;
    useEffect(() => {
        if (
            wasProcessing.current &&
            (actionError || Object.keys(errors).length > 0) &&
            !processing
        ) {
            errorRef.current?.focus();
        }

        wasProcessing.current = processing;
    }, [actionError, errors, processing]);

    return (
        <>
            <p
                role="status"
                aria-live="polite"
                data-test={prefix + '-processing'}
                className="min-h-5 text-xs leading-5 text-muted-foreground"
            >
                {processing ? processingMessage : ''}
            </p>
            {hasError && (
                <div
                    id={prefix + '-error'}
                    ref={errorRef}
                    tabIndex={-1}
                    role="alert"
                    data-test={prefix + '-error'}
                    className="grid min-w-0 gap-2 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 [overflow-wrap:anywhere] text-correction-subtle-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {actionError ? (
                        <p>{actionError}</p>
                    ) : (
                        <>
                            <p className="font-semibold">
                                Ada pengaturan yang perlu diperiksa.
                            </p>
                            <ul className="list-inside list-disc space-y-1">
                                {messages.map((message, index) => (
                                    <li key={index}>{message}</li>
                                ))}
                            </ul>
                        </>
                    )}
                    <p>
                        {uncertain
                            ? 'Pilihan lokal tetap ada. Status tersimpan perlu diperiksa sebelum mencoba kembali.'
                            : 'Pilihanmu tetap ada dan belum mengubah pengaturan tersimpan.'}
                    </p>
                </div>
            )}
            {actionMessage && (
                <p
                    role="status"
                    data-test={prefix + '-success'}
                    className="flex items-start gap-2 rounded-2xl border border-verified/30 bg-verified-subtle p-3 text-sm leading-6 text-verified-subtle-foreground"
                >
                    <CheckCircle2
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0"
                    />
                    {actionMessage}
                </p>
            )}
        </>
    );
}
