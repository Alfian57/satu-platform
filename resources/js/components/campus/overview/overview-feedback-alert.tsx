import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OverviewFeedbackAlertProps {
    errorRef: RefObject<HTMLDivElement | null>;
    hasError: boolean;
    feedback: string;
    isPending: boolean;
    onRetry: () => void;
}

export function OverviewFeedbackAlert({
    errorRef,
    hasError,
    feedback,
    isPending,
    onRetry,
}: OverviewFeedbackAlertProps) {
    return (
        <div
            ref={errorRef}
            tabIndex={-1}
            role={hasError ? 'alert' : 'status'}
            className={cn(
                'rounded-xl text-sm leading-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
                hasError
                    ? 'border border-correction/20 bg-correction-subtle p-4 text-correction-subtle-foreground'
                    : feedback
                      ? 'text-muted-foreground'
                      : 'sr-only',
            )}
        >
            {feedback}
            {hasError && (
                <div className="mt-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 bg-white"
                        disabled={isPending}
                        onClick={onRetry}
                    >
                        Coba lagi
                    </Button>
                </div>
            )}
        </div>
    );
}
