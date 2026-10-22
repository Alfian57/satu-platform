import type { SyncItem } from '@/components/campus/integrations/integration-types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface IntegrationRetryDialogProps {
    confirmingRetry: SyncItem | null;
    processing: boolean;
    feedback: string | null;
    onCancel: () => void;
    onConfirm: () => void;
}

export function IntegrationRetryDialog({
    confirmingRetry,
    processing,
    feedback,
    onCancel,
    onConfirm,
}: IntegrationRetryDialogProps) {
    return (
        <Dialog
            open={confirmingRetry !== null}
            onOpenChange={(open) => {
                if (!open && !processing) {
                    onCancel();
                }
            }}
        >
            <DialogContent
                closeButtonDisabled={processing}
                onEscapeKeyDown={(event) => {
                    if (processing) {
                        event.preventDefault();
                    }
                }}
                onInteractOutside={(event) => {
                    if (processing) {
                        event.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>Ulangi sinkronisasi?</DialogTitle>
                    <DialogDescription>
                        Payload versi terakhir masuk antrean lagi. Pengiriman
                        memakai kunci idempotensi untuk mencegah duplikasi. Ini
                        bukan jaminan sukses penyedia.
                    </DialogDescription>
                </DialogHeader>
                {confirmingRetry && (
                    <p className="rounded-2xl bg-accent p-4 text-sm leading-6 wrap-anywhere">
                        {confirmingRetry.source}. Versi pemetaan{' '}
                        {confirmingRetry.mapping_version}.
                    </p>
                )}
                {feedback && (
                    <p
                        role="alert"
                        className="text-sm leading-6 text-correction-subtle-foreground"
                    >
                        {feedback}
                    </p>
                )}
                <DialogFooter>
                    <Button
                        variant="outline"
                        disabled={processing}
                        onClick={onCancel}
                    >
                        Batal
                    </Button>
                    <Button disabled={processing} onClick={onConfirm}>
                        {processing ? 'Memproses...' : 'Ya, ulangi'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
