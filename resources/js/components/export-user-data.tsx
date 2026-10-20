import { Download, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportMethod } from '@/routes/account/data-rights';

export default function ExportUserData() {
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const handleExport = async () => {
        setIsExporting(true);
        setExportError(null);

        try {
            const response = await fetch(exportMethod.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN':
                        decodeURIComponent(
                            document.cookie
                                .split('; ')
                                .find((row) => row.startsWith('XSRF-TOKEN='))
                                ?.split('=')[1] ?? '',
                        ) || '',
                },
            });

            if (!response.ok) {
                throw new Error('Gagal mengunduh data arsip.');
            }

            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `satu-data-export-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            setExportError(
                'Terjadi kendala saat mengunduh arsip data. Silakan coba kembali.',
            );
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <section
            aria-labelledby="data-rights-title"
            className="grid min-w-0 gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
            data-test="data-rights-card"
        >
            <header className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-satu-orange-border bg-satu-orange-soft text-satu-orange-ink">
                    <FileText aria-hidden="true" className="size-5" />
                </span>
                <div className="grid min-w-0 gap-2">
                    <h2
                        id="data-rights-title"
                        className="text-title font-semibold text-foreground"
                    >
                        Hak akses data
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Unduh salinan data pribadi, profil, riwayat afiliasi,
                        dan persetujuan yang tersimpan pada akunmu dalam format
                        JSON.
                    </p>
                </div>
            </header>

            <div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="min-h-11 w-full cursor-pointer whitespace-normal disabled:cursor-not-allowed sm:w-fit"
                    data-test="export-user-data-button"
                >
                    {isExporting ? (
                        <Loader2
                            aria-hidden="true"
                            className="size-4 animate-spin motion-reduce:animate-none"
                        />
                    ) : (
                        <Download aria-hidden="true" className="size-4" />
                    )}
                    {isExporting ? 'Menyiapkan arsip...' : 'Ekspor data akun'}
                </Button>

                {exportError && (
                    <p role="alert" className="mt-2 text-sm text-destructive">
                        {exportError}
                    </p>
                )}
            </div>
        </section>
    );
}
