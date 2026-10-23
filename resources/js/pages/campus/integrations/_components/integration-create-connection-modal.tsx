import { RequiredMark } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface IntegrationCreateConnectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    busy: boolean;
    unavailable: boolean;
    providerKey: string;
    setProviderKey: (val: string) => void;
    providerError: string | null;
    feedback: string | null;
    onCancel: () => void;
    onSubmit: () => void;
}

export function IntegrationCreateConnectionModal({
    open,
    onOpenChange,
    busy,
    unavailable,
    providerKey,
    setProviderKey,
    providerError,
    feedback,
    onCancel,
    onSubmit,
}: IntegrationCreateConnectionModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                    <DialogTitle>Buat koneksi akademik sandbox</DialogTitle>
                    <DialogDescription>
                        Tambahkan provider koneksi sandbox untuk mensimulasikan
                        sinkronisasi kredit akademik dan memetakan aktivitas
                        mahasiswa.
                    </DialogDescription>
                </DialogHeader>
                <label className="grid min-w-0 gap-1.5">
                    <span className="font-label text-label font-semibold text-muted-foreground">
                        Kunci penyedia (Provider Key)
                        <RequiredMark />
                    </span>
                    <input
                        type="text"
                        disabled={busy}
                        maxLength={100}
                        aria-invalid={Boolean(providerError)}
                        aria-describedby={
                            providerError ? 'provider-error' : undefined
                        }
                        value={providerKey}
                        onChange={(e) => setProviderKey(e.target.value)}
                        placeholder="Contoh: siakad, feeder, atau pd_dikti"
                        className="min-h-11 rounded-xl border border-input bg-transparent px-3 text-base shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <span className="text-xs leading-normal text-muted-foreground">
                            Koneksi dibuat dalam mode Sandbox untuk pengujian
                            lingkungan terpisah.
                        </span>
                        {providerError && (
                            <p
                                id="provider-error"
                                role="alert"
                                className="text-sm text-correction-subtle-foreground"
                            >
                                {providerError}
                            </p>
                        )}
                    </div>
                </label>
                {feedback && (
                    <p
                        role="alert"
                        className="text-sm text-correction-subtle-foreground"
                    >
                        {feedback}
                    </p>
                )}
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={onCancel}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={busy || unavailable || !providerKey.trim()}
                    >
                        {busy ? 'Menyimpan...' : 'Simpan koneksi'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
