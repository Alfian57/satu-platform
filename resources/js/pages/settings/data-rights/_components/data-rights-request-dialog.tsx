import InputError from '@/components/common/input-error';
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
import type {
    Operation,
    OperationConfig,
} from '@/pages/settings/data-rights/_hooks/use-data-rights-form';

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
                className="min-w-0 [overflow-wrap:anywhere]"
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
                <DialogHeader className="text-left">
                    <DialogTitle className="text-base leading-tight font-semibold sm:text-lg">
                        {operation?.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {operation?.description}
                    </DialogDescription>
                </DialogHeader>
                <form className="grid min-w-0 gap-4" onSubmit={onSubmit}>
                    {active !== 'withdrawal' && (
                        <div className="grid min-w-0 gap-1.5">
                            <Label
                                htmlFor="data-rights-reason"
                                className="text-xs font-medium sm:text-sm"
                                required
                            >
                                Keterangan dan alasan
                            </Label>
                            <textarea
                                id="data-rights-reason"
                                name="reason"
                                required
                                maxLength={500}
                                disabled={busy}
                                placeholder={
                                    active === 'correction'
                                        ? 'Jelaskan bagian data yang perlu dikoreksi dan informasi yang seharusnya...'
                                        : active === 'restriction'
                                          ? 'Jelaskan batasan pemrosesan yang kamu inginkan dan alasannya...'
                                          : 'Tuliskan keterangan dan alasan permohonanmu di sini...'
                                }
                                className="min-h-24 rounded-xl border border-input bg-background/60 p-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed"
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
                        <div
                            role="alert"
                            className="rounded-xl border border-destructive/20 bg-destructive/[0.04] px-4 py-3 text-xs leading-relaxed text-foreground/80 sm:text-sm dark:bg-destructive/10 dark:text-foreground/90"
                        >
                            {message}
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-10 cursor-pointer px-4"
                            disabled={busy}
                            onClick={onClose}
                        >
                            Batal
                        </Button>
                        {uncertain ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-10 cursor-pointer px-4"
                                disabled={busy}
                                onClick={onRefresh}
                            >
                                Periksa status
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                className="min-h-10 cursor-pointer px-4 disabled:cursor-not-allowed"
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
