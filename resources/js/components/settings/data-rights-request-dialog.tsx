import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Operation, OperationConfig } from '@/hooks/use-data-rights-form';

export interface DataRightsRequestDialogProps {
    open: boolean;
    operation: OperationConfig | null;
    active: Operation | null;
    reason: string;
    reasonError?: string;
    busy: boolean;
    uncertain: boolean;
    message: string | null;
    onReasonChange: (val: string) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onRefresh: () => void;
}

export function DataRightsRequestDialog({
    open,
    operation,
    active,
    reason,
    reasonError,
    busy,
    uncertain,
    message,
    onReasonChange,
    onClose,
    onSubmit,
    onRefresh,
}: DataRightsRequestDialogProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
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
                    <DialogTitle>{operation?.title}</DialogTitle>
                    <DialogDescription>
                        {operation?.description}
                    </DialogDescription>
                </DialogHeader>
                <form className="grid gap-5" onSubmit={onSubmit}>
                    {active !== 'withdrawal' && (
                        <div className="grid gap-2">
                            <Label htmlFor="data-rights-reason">
                                Keterangan dan alasan
                            </Label>
                            <textarea
                                id="data-rights-reason"
                                name="reason"
                                required
                                maxLength={500}
                                disabled={busy}
                                className="min-h-28 rounded-xl border border-input bg-transparent p-3 text-base focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                                value={reason}
                                onChange={(event) =>
                                    onReasonChange(event.target.value)
                                }
                                aria-invalid={Boolean(reasonError)}
                                aria-describedby={
                                    reasonError
                                        ? 'data-rights-reason-error'
                                        : undefined
                                }
                            />
                            <InputError
                                id="data-rights-reason-error"
                                message={reasonError}
                            />
                        </div>
                    )}
                    {message && (
                        <p
                            role="alert"
                            className="text-sm leading-6 text-correction-subtle-foreground"
                        >
                            {message}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 cursor-pointer"
                            disabled={busy}
                            onClick={onClose}
                        >
                            Batal
                        </Button>
                        {uncertain ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-11 cursor-pointer"
                                disabled={busy}
                                onClick={onRefresh}
                            >
                                Periksa status
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                className="min-h-11 cursor-pointer disabled:cursor-not-allowed"
                                disabled={
                                    busy ||
                                    (active !== 'withdrawal' && !reason.trim())
                                }
                            >
                                {busy
                                    ? 'Mengirim...'
                                    : active === 'withdrawal'
                                      ? 'Konfirmasi penarikan'
                                      : 'Kirim permintaan'}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
