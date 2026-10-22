import { firstError } from '@/components/contributions/contribution-helpers';
import type { ErrorMap } from '@/components/contributions/contribution-helpers';

export interface ComposerErrorSummaryProps {
    errorSummaryRef: React.RefObject<HTMLDivElement | null>;
    errors: ErrorMap;
    hasErrors: boolean;
}

export function ComposerErrorSummary({
    errorSummaryRef,
    errors,
    hasErrors,
}: ComposerErrorSummaryProps) {
    if (!hasErrors) {
        return null;
    }

    return (
        <div
            ref={errorSummaryRef}
            tabIndex={-1}
            role="alert"
            data-test="contribution-composer-errors"
            className="grid min-w-0 gap-2 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm text-correction-subtle-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <p className="font-semibold">
                Ada bagian yang perlu diperiksa sebelum disimpan.
            </p>
            <ul className="list-inside list-disc space-y-1 wrap-anywhere">
                {Object.keys(errors).map((key) => (
                    <li key={key}>{firstError(errors, key)}</li>
                ))}
            </ul>
            <p>Isianmu tetap ada. Periksa pesan di dekat kolom terkait.</p>
        </div>
    );
}
