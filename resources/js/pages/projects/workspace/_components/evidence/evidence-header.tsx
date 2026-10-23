import { LockKeyhole, RefreshCw } from 'lucide-react';
import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
    headingRef: RefObject<HTMLHeadingElement | null>;
    disabled: boolean;
    uncertain: boolean;
    isUploadProcessing: boolean;
    isReadProcessing: boolean;
    onRefresh: () => void;
};

export function EvidenceHeader({
    headingRef,
    disabled,
    uncertain,
    isUploadProcessing,
    isReadProcessing,
    onRefresh,
}: Props) {
    return (
        <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
                <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <LockKeyhole className="size-4" aria-hidden="true" /> PRIVAT
                    DI RUANG KERJA
                </p>
                <h2
                    id="workspace-evidence-title"
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-title font-semibold"
                >
                    Bukti pekerjaan
                </h2>
                <p className="max-w-[70ch] text-sm leading-6 text-muted-foreground">
                    Unggah hasil kerja tanpa harus menulis pesan. Tim yang
                    berizin dapat membacanya. Bukti tidak otomatis masuk
                    portofolio; pilih tugas dan bukti saat mencatat Kontribusi
                    individual.
                </p>
            </div>
            <Button
                type="button"
                variant="outline"
                disabled={disabled || isUploadProcessing || isReadProcessing}
                onClick={onRefresh}
                data-test="evidence-refresh"
            >
                <RefreshCw aria-hidden="true" />
                {uncertain ? 'Periksa hasil unggah' : 'Muat bukti terbaru'}
            </Button>
        </header>
    );
}
