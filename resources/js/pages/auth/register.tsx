import { Head } from '@inertiajs/react';
import RegistrationDetailsStep from '@/components/auth/registration-details-step';
import RegistrationOtpStep from '@/components/auth/registration-otp-step';
import { useRegisterForm } from '@/hooks/use-register-form';
import type { RegistrationState } from '@/hooks/use-register-form';

type Props = {
    passwordRules: string;
    registration?: RegistrationState;
};

export default function Register({ passwordRules, registration }: Props) {
    const { state, actions } = useRegisterForm({ registration });

    return (
        <>
            <Head title="Daftar" />

            <p className="mb-3 text-xs text-slate-600">
                Isian bertanda bintang wajib diisi.
            </p>

            {state.step === 'otp' ? (
                <RegistrationOtpStep
                    registration={registration ?? { step: 'otp' }}
                    otp={state.otp}
                    setOtp={actions.setOtp}
                    secondsLeft={state.secondsLeft}
                    canVerify={state.canVerify}
                />
            ) : (
                <RegistrationDetailsStep
                    passwordRules={passwordRules}
                    status={state.status}
                />
            )}
        </>
    );
}

Register.layout = {
    title: 'Buat akun',
    description:
        'Daftar sebagai mahasiswa. Verifikasi nomor WhatsApp untuk mulai.',
};
