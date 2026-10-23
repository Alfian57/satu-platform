import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export interface ComposerFooterProps {
    mode: 'create' | 'revision';
    processing: boolean;
    blocked: boolean;
    canSubmit: boolean;
    onCancel?: () => void;
}

export function ComposerFooter({
    mode,
    processing,
    blocked,
    canSubmit,
    onCancel,
}: ComposerFooterProps) {
    return (
        <footer className="grid min-w-0 gap-4 rounded-3xl border border-primary/20 bg-linear-to-br from-card to-accent/40 p-5 shadow-md sm:p-6">
            <p className="text-sm leading-6 text-muted-foreground">
                {mode === 'create'
                    ? 'Draft dapat dilengkapi sebelum dikirim untuk validasi.'
                    : 'Pastikan catatan reviewer sudah ditanggapi sebelum membuat versi baru.'}
            </p>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 py-3 whitespace-normal"
                        onClick={onCancel}
                        disabled={processing || blocked}
                    >
                        Batal
                    </Button>
                )}
                <Button
                    type="submit"
                    className="h-auto min-h-11 py-3 whitespace-normal shadow-sm motion-safe:duration-standard"
                    disabled={processing || blocked || !canSubmit}
                    data-test={`contribution-${mode}-submit`}
                >
                    {processing && <Spinner aria-hidden="true" />}
                    {mode === 'create' ? 'Simpan draft' : 'Simpan versi revisi'}
                </Button>
            </div>
            <p
                className="min-h-5 text-xs leading-5 font-medium text-primary"
                role="status"
                aria-live="polite"
                data-test="contribution-save-status"
            >
                {processing
                    ? mode === 'create'
                        ? 'Menyimpan draft kontribusi...'
                        : 'Menyimpan versi baru...'
                    : null}
            </p>
        </footer>
    );
}
