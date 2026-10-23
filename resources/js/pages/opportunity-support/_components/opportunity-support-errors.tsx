import type { RefObject } from 'react';

export function OpportunitySupportErrors({
    errorRef,
    error,
    errors,
}: {
    errorRef: RefObject<HTMLDivElement | null>;
    error: string;
    errors: string[];
}) {
    if (!error && errors.length === 0) {
        return null;
    }

    return (
        <div
            ref={errorRef}
            id="support-errors"
            tabIndex={-1}
            role="alert"
            className="rounded-2xl border border-correction/40 bg-correction/5 p-4 focus-visible:ring-2 focus-visible:ring-ring"
        >
            <p>{error || 'Isian belum sesuai. Perbaiki sebelum mengirim.'}</p>
            {errors.length > 0 && (
                <ul className="mt-2 list-inside list-disc">
                    {errors.map((value, i) => (
                        <li key={i}>{value}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
