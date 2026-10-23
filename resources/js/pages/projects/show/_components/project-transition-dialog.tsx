import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { TransitionAction } from '@/pages/projects/show/_components/show-utils';

export function ProjectTransitionDialog({
    pendingAction,
    isProcessing,
    reason,
    triggerElement,
    onOpenChange,
    onReasonChange,
    onConfirm,
}: {
    pendingAction: TransitionAction | null;
    isProcessing: boolean;
    reason: string;
    triggerElement: HTMLElement | null;
    onOpenChange: (open: boolean) => void;
    onReasonChange: (reason: string) => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={pendingAction !== null} onOpenChange={onOpenChange}>
            <DialogContent
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    triggerElement?.focus();
                }}
            >
                <DialogTitle className="pr-10">
                    {pendingAction === 'cancel'
                        ? 'Batalkan proyek ini?'
                        : 'Arsipkan proyek ini?'}
                </DialogTitle>
                <DialogDescription>
                    {pendingAction === 'cancel'
                        ? 'Proyek tidak lagi menerima tindakan baru. Riwayat audit tetap dipertahankan dan pembatalan tidak dapat dibatalkan dari halaman ini.'
                        : 'Proyek akan dipindahkan menjadi riwayat baca-saja. Pastikan status proyek memang sudah selesai.'}
                </DialogDescription>
                <div className="grid gap-2">
                    <Label htmlFor="project-transition-reason" optional>
                        Alasan
                    </Label>
                    <Input
                        id="project-transition-reason"
                        data-test="project-transition-reason"
                        value={reason}
                        onChange={(event) => onReasonChange(event.target.value)}
                        placeholder="Contoh: Cakupan proyek berubah"
                        maxLength={1000}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            disabled={isProcessing}
                        >
                            Kembali
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        className="cursor-pointer"
                        disabled={isProcessing}
                        data-test="confirm-project-transition"
                        onClick={onConfirm}
                    >
                        {isProcessing && <Spinner aria-hidden="true" />}
                        {pendingAction === 'cancel'
                            ? 'Ya, batalkan proyek'
                            : 'Ya, arsipkan proyek'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
