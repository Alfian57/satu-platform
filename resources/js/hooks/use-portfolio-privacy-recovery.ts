import { useHttp } from '@inertiajs/react';
import { useState } from 'react';

export interface UsePortfolioPrivacyRecoveryOptions<
    TResource extends { id: number; privacy_revision: string },
> {
    resourceId: number;
    readUrl: string;
    onRead: (resource: TResource) => void;
    onAccessRevoked?: () => void;
}

export function usePortfolioPrivacyRecovery<
    TResource extends { id: number; privacy_revision: string },
>({
    resourceId,
    readUrl,
    onRead,
    onAccessRevoked,
}: UsePortfolioPrivacyRecoveryOptions<TResource>) {
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
