import { CircleAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function SettingsFormFeedback({
    errors,
    actionError,
    actionErrorTitle = 'Hasil perubahan belum dapat dikonfirmasi.',
    processing,
    prefix,
    errorHint,
}: {
    errors: Record<string, string>;
    actionError: string | null;
    actionErrorTitle?: string;
    processing: boolean;
    success?: string | null;
    prefix: string;
    errorHint: string;
}) {
    const errorRef = useRef<HTMLDivElement>(null);
    const wasProcessing = useRef(false);

    useEffect(() => {
        if (wasProcessing.current && !processing) {
            if (actionError) {
                errorRef.current?.focus();
            } else if (Object.keys(errors).length > 0) {
                const firstInvalid = document.querySelector<HTMLElement>(
                    'form [aria-invalid="true"]',
                );
                firstInvalid?.focus();
            }
        }

        wasProcessing.current = processing;
    }, [actionError, errors, processing]);

    if (!actionError) {
        return null;
    }

    return (
        <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            id={prefix + '-error-summary'}
            data-test={prefix + '-error-summary'}
            className="flex min-w-0 items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 [overflow-wrap:anywhere] text-correction-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
            <CircleAlert aria-hidden="true" className="mt-1 size-4 shrink-0" />
            <div className="min-w-0">
                <p className="font-semibold">{actionErrorTitle}</p>
                <p className="mt-2">{actionError}</p>
                <p className="mt-2">{errorHint}</p>
            </div>
        </div>
    );
}
