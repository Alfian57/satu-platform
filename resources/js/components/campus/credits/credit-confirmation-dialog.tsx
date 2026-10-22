import type { CreditMappingItem } from '@/components/campus/credits/credit-types';
import { activityLabels } from '@/components/campus/credits/credit-types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function CreditConfirmationDialog({
    confirmation,
    busy,
    processing,
    feedback,
    onClose,
    onConfirm,
}: {
    confirmation: {
        mapping: CreditMappingItem;
        action: 'activate' | 'retire';
    } | null;
    busy: boolean;
    processing: boolean;
    feedback: string | null;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog
            open={confirmation !== null}
            onOpenChange={(open) => {
                if (!open && !busy) {
                    onClose();
                }
            }}
        >
            <DialogContent
                closeButtonDisabled={busy}
                onEscapeKeyDown={(event) => {
                    if (busy) {
                        event.preventDefault();
                    }
                }}
                onInteractOutside={(event) => {
                    if (busy) {
                        event.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>
                        {confirmation?.action === 'activate'
                            ? 'Aktifkan aturan kredit?'
                            : 'Hentikan aturan kredit?'}
                    </DialogTitle>
                    <DialogDescription>
                        {confirmation?.action === 'activate'
                            ? 'Aturan aktif sebelumnya untuk jenis aktivitas yang sama akan dihentikan. Riwayat versi tetap tersimpan.'
                            : 'Aturan ini tidak lagi berlaku untuk pemetaan baru. Sinkronisasi historis tidak berubah.'}
                    </DialogDescription>
                </DialogHeader>
                {confirmation && (
                    <p className="rounded-2xl bg-accent p-4 text-sm leading-6 wrap-anywhere">
                        {activityLabels[confirmation.mapping.activity_type] ??
                            confirmation.mapping.activity_type}
                        . Versi {confirmation.mapping.version}.{' '}
                        {confirmation.mapping.credit_amount} SKS.
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
                    <Button variant="outline" disabled={busy} onClick={onClose}>
                        Batal
                    </Button>
                    <Button
                        disabled={busy}
                        onClick={onConfirm}
                        variant={
                            confirmation?.action === 'retire'
                                ? 'destructive'
                                : 'default'
                        }
                    >
                        {processing
                            ? 'Memproses...'
                            : confirmation?.action === 'activate'
                              ? 'Ya, aktifkan'
                              : 'Ya, hentikan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
