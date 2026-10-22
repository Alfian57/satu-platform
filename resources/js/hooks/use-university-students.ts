import { router } from '@inertiajs/react';
import { useState } from 'react';
import { index } from '@/routes/university/students';

export function useUniversityStudents({
    institutionId,
    initialFilters,
}: {
    institutionId: number;
    initialFilters: { q: string; status: string };
}) {
    const [q, setQ] = useState(initialFilters.q);
    const [status, setStatus] = useState(initialFilters.status);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [denied, setDenied] = useState(false);

    function visitPage(page: number, apply = false): void {
        if (busy) {
            return;
        }

        router.get(
            index.url(institutionId, {
                query: {
                    page,
                    q: apply ? q : initialFilters.q,
                    status: apply ? status : initialFilters.status,
                },
            }),
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
                onError: () =>
                    setError(
                        'Periksa kata kunci dan status. Pilihan belum diterapkan.',
                    ),
                onNetworkError: () => {
                    setError(
                        'Koneksi terputus. Pilihanmu tetap ada; periksa daftar terbaru.',
                    );

                    return false;
                },
                onHttpException: (response) => {
                    if ([401, 403, 404, 419].includes(response.status)) {
                        setDenied(true);
                    }

                    setError(
                        'Daftar belum dapat dibaca. Periksa akses atau masuk ulang.',
                    );

                    return false;
                },
            },
        );
    }

    return {
        q,
        status,
        busy,
        error,
        denied,
        actions: {
            setQ,
            setStatus,
            visitPage,
        },
    };
}
