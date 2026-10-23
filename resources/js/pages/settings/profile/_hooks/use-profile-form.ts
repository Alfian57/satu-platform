import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';

export function useProfileForm() {
    const { account, auth } = usePage<{
        account: { name: string; username: string };
        auth: { user?: { workspace: { role: string } } };
    }>().props;
    const form = useForm({
        name: account.name,
        username: account.username,
    });
    const { errors, processing, recentlySuccessful, isDirty } = form;
    const [actionError, setActionError] = useState<string | null>(null);
    const isStudent = auth.user?.workspace.role === 'student';

    function submitProfileUpdate(event: React.FormEvent): void {
        event.preventDefault();

        if (processing) {
            return;
        }

        form.submit(ProfileController.update(), {
            preserveScroll: true,
            onStart: () => setActionError(null),
            onSuccess: () => form.setDefaults(),
            onNetworkError: () => {
                setActionError(
                    'Koneksi terputus. Periksa koneksi dan coba simpan lagi.',
                );

                return false;
            },
            onHttpException: (response) => {
                setActionError(
                    [401, 403, 419].includes(response.status)
                        ? 'Sesi atau akses perubahan tidak tersedia. Muat ulang halaman sebelum mencoba lagi.'
                        : 'Respons penyimpanan belum tersedia. Periksa status akun dengan memuat ulang sebelum mencoba lagi.',
                );

                return false;
            },
        });
    }

    return {
        form,
        actionError,
        isStudent,
        processing,
        recentlySuccessful,
        isDirty,
        errors,
        actions: {
            submitProfileUpdate,
            setName: (val: string) => form.setData('name', val),
            setUsername: (val: string) => form.setData('username', val),
        },
    };
}
