import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    error: string | null;
    validation: string | null;
    mustCheck: boolean;
    syncing: boolean;
    feedbackRef: RefObject<HTMLDivElement | null>;
    onReload: () => void;
};

export function TeamFeedbackAlert({
    error,
    validation,
    mustCheck,
    syncing,
    feedbackRef,
    onReload,
}: Props) {
    if (!error && !validation && !mustCheck) {
        return null;
    }

    return (
        <div
            ref={feedbackRef}
            tabIndex={-1}
            role="alert"
            className="grid gap-3 rounded-xl border border-correction/40 bg-correction-subtle p-3 text-sm leading-6 wrap-anywhere focus-visible:outline-2 focus-visible:outline-ring"
        >
            <p>{error ?? validation}</p>
            {mustCheck && (
                <Button
                    type="button"
                    variant="outline"
                    disabled={syncing}
                    onClick={onReload}
                    className="min-h-11 w-full whitespace-normal"
                >
                    {syncing && <Spinner aria-hidden="true" />}
                    Periksa status terbaru
                </Button>
            )}
        </div>
    );
}
