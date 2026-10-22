import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { UseContributionDetailReturn } from '@/hooks/use-contribution-detail';

export interface ContributionActionAlertsProps {
    state: UseContributionDetailReturn['state'];
    submitErrorSummaryRef: React.RefObject<HTMLDivElement | null>;
}

export function ContributionActionAlerts({
    state,
    submitErrorSummaryRef,
}: ContributionActionAlertsProps) {
    const { actionMessage, actionError, submitErrors, revisionError } = state;

    if (
        !actionMessage &&
        !actionError &&
        submitErrors.length === 0 &&
        !revisionError
    ) {
        return null;
    }

    return (
        <div className="min-h-0 text-sm" data-test="contribution-action-status">
            {actionMessage && (
                <div
                    role="status"
                    className="flex items-start gap-3 rounded-2xl border border-verified/30 bg-verified-subtle px-4 py-3 text-verified-subtle-foreground"
                >
                    <CheckCircle2
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0"
                    />
                    <p>{actionMessage}</p>
                </div>
            )}
            {actionError && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle px-4 py-3 [overflow-wrap:anywhere] text-correction-subtle-foreground"
                    data-test="contribution-action-error"
                >
                    <AlertCircle
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0"
                    />
                    <p>{actionError}</p>
                </div>
            )}
            {submitErrors.length > 0 && (
                <div
                    ref={submitErrorSummaryRef}
                    role="alert"
                    tabIndex={-1}
                    data-test="contribution-submit-errors"
                    className="mt-2 grid gap-2 rounded-2xl border border-correction/30 bg-correction-subtle px-4 py-3 text-correction-subtle-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <p className="font-semibold">
                        Kontribusi belum terkirim. Periksa catatan berikut.
                    </p>
                    <ul className="list-inside list-disc space-y-1 [overflow-wrap:anywhere]">
                        {submitErrors.map((message, index) => (
                            <li key={index}>{message}</li>
                        ))}
                    </ul>
                    <p>
                        Draft tetap tersimpan. Perbaiki catatan sebelum mengirim
                        kembali.
                    </p>
                </div>
            )}
            {revisionError && (
                <p className="mt-2 rounded-2xl border border-correction/30 bg-correction-subtle px-4 py-3 text-correction-subtle-foreground">
                    {revisionError}
                </p>
            )}
        </div>
    );
}
