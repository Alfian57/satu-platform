import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';

export function useSecurityForm({ passwordRules }: { passwordRules: string }) {
    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const { errors, processing, recentlySuccessful } = form;
    const [actionError, setActionError] = useState<string | null>(null);
    const minimumLength = /minlength:\s*(\d+)/.exec(passwordRules)?.[1];

    function submitPasswordUpdate(event: React.FormEvent): void {
        event.preventDefault();

        if (processing) {
            return;
        }

        form.submit(SecurityController.update(), {
            preserveScroll: true,
            onStart: () => setActionError(null),
            onError: () =>
                form.reset(
                    'password',
                    'password_confirmation',
                    'current_password',
                ),
            onSuccess: () => form.reset(),
            onNetworkError: () => {
                setActionError(
                    'Koneksi terputus. Perubahan password belum dapat dikonfirmasi. Periksa koneksi dan status akun sebelum mencoba lagi.',
                );

                return false;
            },
            onHttpException: (response) => {
                setActionError(
                    [401, 403, 419].includes(response.status)
                        ? 'Sesi atau akses perubahan tidak tersedia. Muat ulang halaman sebelum mencoba lagi.'
                        : response.status === 429
                          ? 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.'
                          : 'Respons perubahan password belum tersedia. Periksa status akun sebelum mencoba lagi.',
                );

                return false;
            },
        });
    }

    return {
        form,
        actionError,
        minimumLength,
        processing,
        recentlySuccessful,
        errors,
        actions: {
            submitPasswordUpdate,
            setCurrentPassword: (val: string) =>
                form.setData('current_password', val),
            setPassword: (val: string) => form.setData('password', val),
            setPasswordConfirmation: (val: string) =>
                form.setData('password_confirmation', val),
        },
    };
}
