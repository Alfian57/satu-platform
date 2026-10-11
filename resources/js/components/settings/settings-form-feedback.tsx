import { CheckCircle2, CircleAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function SettingsFormFeedback({
    errors,
    actionError,
    processing,
    success,
    prefix,
    errorHint,
}: {
    errors: Record<string, string>;
    actionError: string | null;
    processing: boolean;
    success?: string | null;
    prefix: string;
    errorHint: string;
}) {
    const errorRef = useRef<HTMLDivElement>(null);
    const wasProcessing = useRef(false);
    const messages = Object.values(errors).filter(Boolean);
    useEffect(() => {
        if (
            wasProcessing.current &&
            !processing &&
            (actionError || Object.keys(errors).length > 0)
        ) {
            errorRef.current?.focus();
        }

        wasProcessing.current = processing;
    }, [actionError, errors, processing]);

    return (
        <>
            {(actionError || messages.length > 0) && (
                <div
                    ref={errorRef}
                    tabIndex={-1}
                    role="alert"
                    id={prefix + '-error-summary'}
                    data-test={prefix + '-error-summary'}
                    className="flex min-w-0 items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 [overflow-wrap:anywhere] text-correction-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                    <CircleAlert
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0"
                    />
                    <div className="min-w-0">
                        <p className="font-semibold">
                            {actionError
                                ? 'Hasil perubahan belum dapat dikonfirmasi.'
                                : 'Ada isian yang perlu diperiksa.'}
                        </p>
                        {actionError ? (
                            <p className="mt-2">{actionError}</p>
                        ) : (
                            <ul className="mt-2 list-inside list-disc space-y-1">
                                {messages.map((message, index) => (
                                    <li key={index}>{message}</li>
                                ))}
                            </ul>
                        )}
                        <p className="mt-2">{errorHint}</p>
                    </div>
                </div>
            )}
            {success && !actionError && messages.length === 0 && (
                <p
                    role="status"
                    data-test={prefix + '-success'}
                    className="flex items-start gap-2 rounded-2xl border border-verified/30 bg-verified-subtle p-4 text-sm leading-6 text-verified-subtle-foreground"
                >
                    <CheckCircle2
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0"
                    />
                    {success}
                </p>
            )}
        </>
    );
}
