import { RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface ContributionQueueAlertsProps {
    actionMessage: string | null;
    actionError: string | null;
    queueError: string | null;
    isLoading: boolean;
    onRefreshQueue: () => void;
}

export function ContributionQueueAlerts({
    actionMessage,
    actionError,
    queueError,
    isLoading,
    onRefreshQueue,
}: ContributionQueueAlertsProps) {
    useEffect(() => {
        if (actionMessage) {
            toast.success(actionMessage);
        }
    }, [actionMessage]);

    useEffect(() => {
        if (actionError) {
            toast.error(actionError);
        }
    }, [actionError]);

    if (!queueError) {
        return null;
    }

    return (
        <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-correction/30 bg-correction-subtle p-4 text-xs font-semibold text-correction-subtle-foreground shadow-sm"
            data-test="campus-contribution-queue-error"
        >
            <span>{queueError}</span>
            <Button
                type="button"
                variant="outline"
                className="min-h-11 cursor-pointer rounded-xl bg-white text-xs disabled:cursor-not-allowed"
                disabled={isLoading}
                onClick={onRefreshQueue}
                data-test="campus-contribution-queue-error-retry"
            >
                {isLoading ? (
                    <Spinner className="mr-1 size-3" />
                ) : (
                    <RefreshCw className="mr-1 size-3 text-muted-foreground" />
                )}
                Coba lagi
            </Button>
        </div>
    );
}
