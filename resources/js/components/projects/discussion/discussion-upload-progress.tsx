import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PendingUpload } from './discussion-utils';

type Props = {
    pendingUpload: PendingUpload;
    uploadPercentage: number;
    disabled: boolean;
    uncertain: boolean;
    isUploading: boolean;
    isCheckLoading: boolean;
    onRetry: () => void;
    onCancelRetry: () => void;
};

export function DiscussionUploadProgress({
    pendingUpload,
    uploadPercentage,
    disabled,
    uncertain,
    isUploading,
    isCheckLoading,
    onRetry,
    onCancelRetry,
}: Props) {
    return (
        <div
            className="grid gap-3 border border-border bg-background px-4 py-3"
            data-test="discussion-attachment-upload"
            role="status"
            aria-live="polite"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold">
                        {pendingUpload.status === 'uploading'
                            ? 'Mengunggah bukti'
                            : 'Bukti belum tersimpan'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {pendingUpload.file.name}
                    </p>
                </div>
                {pendingUpload.status === 'failed' && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={onRetry}
                        disabled={
                            disabled ||
                            uncertain ||
                            isUploading ||
                            isCheckLoading
                        }
                        data-test="discussion-upload-retry"
                    >
                        <RefreshCw aria-hidden="true" />
                        Coba unggah lagi
                    </Button>
                )}
            </div>
            {pendingUpload.status === 'uploading' ? (
                <div className="grid gap-2">
                    <progress
                        className="h-2 w-full accent-primary"
                        max={100}
                        value={uploadPercentage}
                        aria-label="Kemajuan unggah bukti"
                    />
                    <p className="text-xs text-muted-foreground">
                        {uploadPercentage}% terkirim. File belum dianggap
                        tersimpan sampai server mengonfirmasi.
                    </p>
                </div>
            ) : (
                <p className="text-sm text-correction-subtle-foreground">
                    {pendingUpload.error ??
                        'File tetap tersedia untuk dicoba kembali.'}
                </p>
            )}
            {pendingUpload.status === 'failed' && (
                <Button
                    type="button"
                    variant="ghost"
                    className="w-fit"
                    disabled={uncertain || disabled || isCheckLoading}
                    onClick={onCancelRetry}
                >
                    Lanjut tanpa unggah ulang
                </Button>
            )}
        </div>
    );
}
