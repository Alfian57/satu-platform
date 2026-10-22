import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    disabled: boolean;
    canLoadOlder: boolean;
    isOlderLoading: boolean;
    isCheckLoading: boolean;
    isDiscussionProcessing: boolean;
    isUploading: boolean;
    actionMessage: string | null;
    actionError: string | null;
    onLoadOlder: () => void;
    onCheckLatest: () => void;
};

export function DiscussionHeader({
    disabled,
    canLoadOlder,
    isOlderLoading,
    isCheckLoading,
    isDiscussionProcessing,
    isUploading,
    actionMessage,
    actionError,
    onLoadOlder,
    onCheckLatest,
}: Props) {
    return (
        <div className="grid gap-5">
            <header className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-5">
                <div className="grid gap-2">
                    <p className="font-label text-label text-muted-foreground">
                        DISKUSI OPSIONAL
                    </p>
                    <h2
                        id="workspace-discussion-title"
                        className="text-title font-semibold"
                    >
                        Diskusi tim (opsional)
                    </h2>
                    <p className="max-w-[70ch] text-sm leading-6 text-muted-foreground">
                        Gunakan untuk pertanyaan, hambatan, atau serah terima.
                        Tidak perlu berbicara di sini untuk menyelesaikan tugas
                        atau mengunggah bukti privat.
                    </p>
                </div>
                {canLoadOlder && (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-fit cursor-pointer"
                        disabled={isOlderLoading}
                        onClick={onLoadOlder}
                        data-test="discussion-load-older"
                    >
                        {isOlderLoading ? (
                            <Spinner aria-hidden="true" />
                        ) : (
                            <RefreshCw aria-hidden="true" />
                        )}
                        Muat diskusi sebelumnya
                    </Button>
                )}
            </header>

            <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={onCheckLatest}
                disabled={
                    disabled ||
                    isUploading ||
                    isDiscussionProcessing ||
                    isCheckLoading
                }
                data-test="discussion-check-latest"
            >
                <RefreshCw aria-hidden="true" />
                {isCheckLoading
                    ? 'Memeriksa diskusi...'
                    : 'Periksa diskusi terbaru'}
            </Button>

            <div className="grid gap-3" aria-live="polite">
                {actionMessage && (
                    <p
                        className="flex items-start gap-2 border border-verified/30 bg-verified-subtle px-3 py-2 text-sm text-verified-subtle-foreground"
                        data-test="discussion-action-success"
                        role="status"
                    >
                        <CheckCircle2
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        <span>{actionMessage}</span>
                    </p>
                )}
                {actionError && (
                    <p
                        className="flex items-start gap-2 border border-correction/30 bg-correction-subtle px-3 py-2 text-sm text-correction-subtle-foreground"
                        data-test="discussion-action-error"
                        role="alert"
                    >
                        <AlertCircle
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        <span>{actionError}</span>
                    </p>
                )}
            </div>
        </div>
    );
}
