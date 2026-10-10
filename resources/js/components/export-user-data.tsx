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
            className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
            data-test="data-rights-card"
        >
            <header className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                    <FileText aria-hidden="true" className="size-5" />
                </span>
                <div className="grid gap-1">
                    <h2
                        id="data-rights-title"
                        className="text-title font-bold tracking-[-0.02em] text-slate-950"
                    >
                        Hak akses data
                    </h2>
                    <p className="text-sm leading-6 text-slate-600">
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
                    className="w-fit cursor-pointer disabled:cursor-not-allowed"
                    data-test="export-user-data-button"
                >
                    {isExporting ? (
                        <Loader2
                            aria-hidden="true"
                            className="size-4 animate-spin"
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
