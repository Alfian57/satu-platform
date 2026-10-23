import { Head } from '@inertiajs/react';
import ConfirmPasswordForm from '@/pages/auth/confirm-password/_components/confirm-password-form';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Konfirmasi password" />

            <ConfirmPasswordForm />
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Konfirmasi password',
    description:
        'Masukkan password akunmu untuk melanjutkan ke halaman yang dilindungi.',
};
