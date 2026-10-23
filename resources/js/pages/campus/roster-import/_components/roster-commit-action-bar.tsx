import { AlertTriangle, CheckCircle2, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { RosterPreview } from '@/pages/campus/roster-import/_types/roster-types';

export function RosterCommitActionBar({
    preview,
    isCommitting,
    isProcessing,
    onCommit,
}: {
    preview: RosterPreview;
    isCommitting: boolean;
    isProcessing: boolean;
    onCommit: () => void;
}) {
    if (preview.valid_rows === 0) {
        return (
            <Alert
                variant="destructive"
                className="rounded-3xl border-correction/30 bg-correction-subtle text-correction-subtle-foreground shadow-sm"
            >
                <AlertTriangle
                    aria-hidden="true"
                    className="size-4 text-correction-subtle-foreground"
                />
                <AlertTitle className="font-bold">
                    Tidak ada baris yang dapat diimpor
                </AlertTitle>
                <AlertDescription className="text-xs text-correction-subtle-foreground">
                    Perbaiki struktur berkas CSV, lalu unggah kembali untuk
                    membuat pratinjau baru.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs text-muted-foreground">
                {preview.error_rows > 0
                    ? 'Baris yang tidak valid tidak akan diimpor. Pastikan jumlah baris valid sudah sesuai.'
                    : 'Semua baris telah siap diimpor ke master data.'}
            </p>
            <Button
                type="button"
                onClick={onCommit}
                disabled={isCommitting || isProcessing}
                className="min-h-11 cursor-pointer rounded-xl bg-verified px-5 text-xs font-semibold text-white shadow-sm hover:bg-verified/90 disabled:cursor-not-allowed"
            >
                {isCommitting ? (
                    <LoaderCircle
                        aria-hidden="true"
                        className="mr-1.5 size-3.5 animate-spin motion-reduce:animate-none"
                    />
                ) : (
                    <CheckCircle2
                        aria-hidden="true"
                        className="mr-1.5 size-3.5"
                    />
                )}
                {isCommitting
                    ? 'Mengimpor roster...'
                    : `Impor ${preview.valid_rows} Baris Valid`}
            </Button>
        </div>
    );
}
