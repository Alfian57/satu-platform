import { useHttp } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function usePortfolioPrivacyRecovery<
    TResource extends { id: number; privacy_revision: string },
>({
    resourceId,
    readUrl,
    onRead,
    onAccessRevoked,
}: {
    resourceId: number;
    readUrl: string;
    onRead: (resource: TResource) => void;
    onAccessRevoked?: () => void;
}) {
    const [needsCheck, setNeedsCheck] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const read = useHttp<Record<string, never>, { data: TResource }>({});

    function onHttpException(response: { status: number }): false {
        setNeedsCheck(true);

        if ([401, 403, 404].includes(response.status)) {
            onAccessRevoked?.();
            setError(
                'Akses portofolio tidak tersedia. Periksa afiliasi atau masuk kembali.',
            );
        } else {
            setError(
                response.status === 409
                    ? 'Pengaturan berubah di sesi lain. Periksa pengaturan terbaru sebelum menyimpan kembali.'
                    : 'Hasil penyimpanan belum dapat dipastikan. Periksa pengaturan terbaru sebelum mencoba kembali.',
            );
        }

        return false;
    }

    function onNetworkError(): false {
        setNeedsCheck(true);
        setError(
            'Koneksi terputus. Hasil penyimpanan belum pasti. Periksa pengaturan terbaru sebelum mencoba kembali.',
        );

        return false;
    }

    function checkLatest(): void {
        if (read.processing) {
            return;
        }

        read.get(readUrl, {
            onHttpException: (response) => {
                if ([401, 403, 404].includes(response.status)) {
                    onAccessRevoked?.();
                }

                setError(
                    'Pengaturan terbaru belum dapat dibaca. Penyimpanan ulang tetap ditahan.',
                );

                return false;
            },
            onNetworkError: () => {
                setError(
                    'Koneksi belum tersedia. Penyimpanan ulang tetap ditahan.',
                );

                return false;
            },
        })
            .then((response) => {
                if (
                    response.data?.id !== resourceId ||
                    !/^[a-f0-9]{64}$/.test(response.data.privacy_revision ?? '')
                ) {
                    setError(
                        'Pengaturan terbaru belum dapat dipastikan. Penyimpanan ulang tetap ditahan.',
                    );

                    return;
                }

                onRead(response.data);
                setNeedsCheck(false);
                setError(null);
            })
            .catch(() => undefined);
    }

    return {
        needsCheck,
        error,
        blocked: needsCheck || read.processing,
        checking: read.processing,
        onHttpException,
        onNetworkError,
        checkLatest,
    };
}

export function PortfolioPrivacyRecoveryNotice({
    recovery,
    prefix,
}: {
    recovery: {
        needsCheck: boolean;
        checking: boolean;
        checkLatest: () => void;
    };
    prefix: string;
}) {
    if (!recovery.needsCheck) {
        return null;
    }

    return (
        <div
            className="grid gap-3 rounded-xl border border-[#F2D3A9] bg-[#FFF4E5] p-3 text-sm leading-6 text-[#C2410C]"
            data-test={prefix + '-recovery'}
        >
            <p>
                Pilihan lokal tetap ada. Periksa status tersimpan tanpa mengirim
                perubahan lagi.
            </p>
            <Button
                type="button"
                variant="outline"
                className="min-h-11 whitespace-normal"
                disabled={recovery.checking}
                onClick={recovery.checkLatest}
                data-test={prefix + '-check-latest'}
            >
                {recovery.checking
                    ? 'Memeriksa pengaturan...'
                    : 'Periksa pengaturan terbaru'}
            </Button>
        </div>
    );
}
