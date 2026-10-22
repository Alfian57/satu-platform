import { router } from '@inertiajs/react';
import { useState } from 'react';
import { index } from '@/routes/university/settings';

export function useUniversitySettings({
    institutionId,
    section = 'profile',
}: {
    institutionId: number;
    section?: 'profile' | 'semester';
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [denied, setDenied] = useState(false);

    function visitPage(next: number): void {
        if (busy) {
            return;
        }

        router.get(
            index.url(institutionId, { query: { page: next, section } }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onSuccess: () => {
                    setError('');
                    setDenied(false);
                },
                onNetworkError: () => {
                    setError(
                        'Daftar semester belum dapat dibaca. Coba periksa kembali.',
                    );

                    return false;
                },
                onHttpException: (response) => {
                    if ([401, 403, 404, 419].includes(response.status)) {
                        setDenied(true);
                    }

                    setError(
                        'Sesi atau data terbaru belum tersedia. Periksa kembali atau masuk ulang.',
                    );

                    return false;
                },
            },
        );
    }

    return {
        busy,
        error,
        denied,
        actions: {
            visitPage,
        },
    };
}
