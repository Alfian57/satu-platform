import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { store } from '@/routes/password/confirm';

export function useSecurityConfirmForm() {
    const form = useForm({ password: '' });
    const { processing, errors } = form;
    const [actionError, setActionError] = useState<string | null>(null);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (processing) {
            return;
        }

        form.submit(store(), {
            onStart: () => {
                setActionError(null);
                form.clearErrors();
            },
            onSuccess: () => {
                form.reset('password');
            },
            onError: () => {
                form.reset('password');
            },
            onNetworkError: () => {
                setActionError(
                    'Koneksi terputus. Konfirmasi belum dapat dipastikan. Periksa koneksi dan coba lagi.',
                );

                return false;
            },
            onHttpException: (response) => {
                setActionError(
                    [401, 403, 419].includes(response.status)
                        ? 'Sesi atau akses konfirmasi tidak tersedia. Muat ulang halaman, lalu masuk kembali jika diminta.'
                        : response.status === 429
                          ? 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba kembali.'
                          : 'Respons konfirmasi belum tersedia. Muat ulang halaman untuk memeriksa akses sebelum mencoba lagi.',
                );

                return false;
            },
        });
    };

    return {
        data: form.data,
        processing,
        errors,
        actionError,
        setPassword: (password: string) => form.setData('password', password),
        onSubmit: handleSubmit,
    };
}
