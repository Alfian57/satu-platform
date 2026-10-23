import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProjectErrorState({
    onRetry,
    forbidden,
    processing,
}: {
    onRetry: () => void;
    forbidden: boolean;
    processing: boolean;
}) {
    return (
        <section
            role="alert"
            data-test="projects-error"
            className="flex flex-col gap-4 rounded-2xl border border-correction/40 bg-correction-subtle px-5 py-5 text-correction-subtle-foreground sm:flex-row sm:items-start sm:justify-between"
        >
            <div className="flex min-w-0 items-start gap-3">
                <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0"
                />
                <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold">
                        {forbidden
                            ? 'Daftar proyek tidak dapat diakses'
                            : 'Daftar proyek belum termuat'}
                    </h3>
                    <p className="text-sm leading-6">
                        {forbidden
                            ? 'Akses daftar proyek tidak tersedia untuk akunmu saat ini. Periksa afiliasi kampus atau coba muat ulang.'
                            : 'Filter tetap tersimpan. Coba muat ulang daftar proyek untuk melanjutkan.'}
                    </p>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                onClick={onRetry}
                disabled={processing}
                aria-busy={processing}
                className="shrink-0 border-correction/50 bg-transparent text-correction-subtle-foreground hover:bg-correction/10"
            >
                {processing ? 'Memuat ulang...' : 'Coba lagi'}
            </Button>
        </section>
    );
}
