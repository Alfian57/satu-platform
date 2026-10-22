import { Head } from '@inertiajs/react';
import RecoveryOtpStep from '@/components/auth/recovery-otp-step';
import RecoveryPhoneStep from '@/components/auth/recovery-phone-step';
import RecoveryResetStep from '@/components/auth/recovery-reset-step';
import TextLink from '@/components/text-link';
import { useRecoveryForm } from '@/hooks/use-recovery-form';
import type { RecoveryState } from '@/hooks/use-recovery-form';
import { login, register } from '@/routes';

type Props = {
    recovery?: RecoveryState;
};

export default function Recover({ recovery }: Props) {
    const { state, actions } = useRecoveryForm({ recovery });

    return (
        <>
            <Head title="Pemulihan akun" />

            {state.step === 'otp' ? (
                <RecoveryOtpStep
                    recovery={recovery ?? { step: 'otp' }}
                    otp={state.otp}
                    setOtp={actions.setOtp}
                    secondsLeft={state.secondsLeft}
                    canVerify={state.canVerify}
                />
            ) : state.step === 'reset' ? (
                <RecoveryResetStep />
            ) : (
                <RecoveryPhoneStep status={state.status} />
            )}

            <div className="mt-4 border-t border-slate-100 pt-3.5 text-center text-base text-slate-600 sm:mt-5 sm:text-[17px]">
                Ingat username dan password?{' '}
                <TextLink
                    href={login()}
                    className="ml-1 inline-flex min-h-11 cursor-pointer items-center font-bold text-blue-600 no-underline hover:text-blue-700 hover:underline"
                >
                    Masuk
                </TextLink>
                <span aria-hidden="true" className="mx-1">
                    ·
                </span>
                <TextLink
                    href={register()}
                    className="inline-flex min-h-11 cursor-pointer items-center font-bold text-blue-600 no-underline hover:text-blue-700 hover:underline"
                >
                    Daftar
                </TextLink>
            </div>
        </>
    );
}

Recover.layout = {
    title: 'Pulihkan akun',
    description:
        'Verifikasi nomor WhatsApp untuk membuat password baru. SATU tidak memakai email untuk pemulihan.',
};
