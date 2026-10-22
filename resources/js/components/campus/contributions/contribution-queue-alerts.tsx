import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    return (
        <>
            {actionMessage && (
                <Alert className="rounded-3xl border-verified/30 bg-verified-subtle text-verified-subtle-foreground shadow-sm">
                    <CheckCircle2 className="size-4 text-verified-subtle-foreground" />
                    <AlertTitle className="font-bold">
                        Perubahan Tersimpan
                    </AlertTitle>
                    <AlertDescription
                        className="text-xs text-verified-subtle-foreground"
                        data-test="campus-contribution-action-success"
                    >
                        {actionMessage}
                    </AlertDescription>
                </Alert>
            )}

            {actionError && (
                <Alert
                    variant="destructive"
                    className="rounded-3xl border-correction/30 bg-correction-subtle text-correction-subtle-foreground shadow-sm"
                    data-test="campus-contribution-action-error"
                >
                    <AlertTriangle className="size-4 text-correction-subtle-foreground" />
                    <AlertTitle className="font-bold">
                        Keputusan belum tersimpan
                    </AlertTitle>
                    <AlertDescription className="text-xs text-correction-subtle-foreground">
                        {actionError}
                    </AlertDescription>
                </Alert>
            )}

            {queueError && (
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
            )}
        </>
    );
}
