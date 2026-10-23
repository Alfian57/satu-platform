import { Head } from '@inertiajs/react';
import LoginForm from '@/pages/auth/login/_components/login-form';

type Props = {
    status?: string;
};

export default function Login({ status }: Props) {
    return (
        <>
            <Head title="Masuk" />

            <LoginForm />

            {status && (
                <div
                    role="status"
                    className="mt-4 rounded-xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700"
                >
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Senang kamu kembali.',
    description: 'Masuk untuk melanjutkan karya dan kolaborasimu.',
};
