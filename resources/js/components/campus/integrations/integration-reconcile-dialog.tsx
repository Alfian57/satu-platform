import type { FormEvent } from 'react';
import type { SyncItem } from '@/components/campus/integrations/integration-types';
import { campusControlClass } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface IntegrationReconcileDialogProps {
    confirmingReconcile: SyncItem | null;
    processing: boolean;
    reconcileReason: string;
    setReconcileReason: (val: string) => void;
    reasonError: string | null;
    feedback: string | null;
    onCancel: () => void;
    onSubmit: () => void;
}

export function IntegrationReconcileDialog({
    confirmingReconcile,
    processing,
    reconcileReason,
    setReconcileReason,
    reasonError,
    feedback,
    onCancel,
    onSubmit,
}: IntegrationReconcileDialogProps) {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit();
    }

    return (
        <Dialog
            open={confirmingReconcile !== null}
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
                    <DialogTitle>Rekonsiliasi manual</DialogTitle>
                    <DialogDescription>
                        Tandai berkas telah diselesaikan secara manual. Alasan
                        dan keputusan menjadi riwayat yang tidak dapat ditimpa.
                    </DialogDescription>
                </DialogHeader>
                {confirmingReconcile && (
                    <p className="rounded-2xl bg-accent p-4 text-sm leading-6 wrap-anywhere">
                        {confirmingReconcile.source}. Versi pemetaan{' '}
                        {confirmingReconcile.mapping_version}.
                    </p>
                )}
                <form
                    aria-label="Rekonsiliasi manual"
                    onSubmit={handleSubmit}
                    className="grid gap-4"
                >
                    <div className="grid gap-2">
                        <label
                            htmlFor="sync-reconcile-reason"
                            className="text-sm font-semibold"
                        >
                            Alasan rekonsiliasi (wajib)
                        </label>
                        <textarea
                            id="sync-reconcile-reason"
                            required
                            rows={3}
                            maxLength={1000}
                            disabled={processing}
                            value={reconcileReason}
                            onChange={(event) =>
                                setReconcileReason(event.target.value)
                            }
                            placeholder="Jelaskan bagaimana masalah telah diselesaikan."
                            aria-invalid={Boolean(reasonError)}
                            aria-describedby="sync-reason-help sync-reason-error"
                            className={cn(campusControlClass, 'resize-y')}
                        />
                        <p
                            id="sync-reason-help"
                            className="text-xs leading-5 text-muted-foreground"
                        >
                            Maksimum 1.000 karakter. Rekonsiliasi tidak mengirim
                            ulang payload.
                        </p>
                        {reasonError && (
                            <p
                                role="alert"
                                id="sync-reason-error"
                                className="text-sm text-correction-subtle-foreground"
                            >
                                {reasonError}
                            </p>
                        )}
                    </div>
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
                            type="button"
                            variant="outline"
                            disabled={processing}
                            onClick={onCancel}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                processing || reconcileReason.trim() === ''
                            }
                        >
                            {processing ? 'Memproses...' : 'Catat rekonsiliasi'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
