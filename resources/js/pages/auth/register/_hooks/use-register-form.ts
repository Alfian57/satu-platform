import { useEffect, useState } from 'react';
import { login, register } from '@/routes';
import { start } from '@/routes/register';
import { resend, verify } from '@/routes/register/otp';

export type RegistrationDeliveryStatus =
    'queued' | 'sent' | 'failed' | 'locked' | null;

export type RegistrationState = {
    step?: 'details' | 'otp';
    maskedPhone?: string | null;
    deliveryStatus?: RegistrationDeliveryStatus;
    resendAvailableAt?: number | null;
    status?: 'expired' | null;
};

export type UseRegisterFormOptions = {
    registration?: RegistrationState;
};

export function useRegisterForm({ registration }: UseRegisterFormOptions = {}) {
    const state = registration ?? { step: 'details' as const };
    const step = state.step ?? 'details';
    const [otp, setOtp] = useState('');
    const [now, setNow] = useState(() => Date.now());

    const resendAvailableAt = state.resendAvailableAt ?? null;
    const secondsLeft = resendAvailableAt
        ? Math.max(0, Math.ceil((resendAvailableAt * 1000 - now) / 1000))
        : 0;

    useEffect(() => {
        if (!resendAvailableAt || secondsLeft <= 0) {
            return;
        }

        const updateClock = () => setNow(Date.now());
        const timer = window.setInterval(updateClock, 1000);
        document.addEventListener('visibilitychange', updateClock);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', updateClock);
        };
    }, [resendAvailableAt, secondsLeft]);

    return {
        state: {
            step,
            otp,
            secondsLeft,
            canResend: secondsLeft <= 0,
            canVerify: otp.length === 6,
            maskedPhone: state.maskedPhone ?? 'nomor WhatsApp Anda',
            deliveryStatus: state.deliveryStatus ?? null,
            status: state.status ?? null,
        },
        actions: {
            setOtp,
        },
        routes: {
            startUrl: start.url(),
            verifyUrl: verify.url(),
            resendUrl: resend.url(),
            restartUrl: register({ query: { restart: 1 } }),
            loginUrl: login(),
        },
    };
}
