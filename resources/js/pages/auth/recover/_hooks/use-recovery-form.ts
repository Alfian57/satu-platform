import { useEffect, useState } from 'react';
import { login, recover as recoverPage, register } from '@/routes';
import { start } from '@/routes/recover';
import { resend, verify } from '@/routes/recover/otp';
import { update } from '@/routes/recover/password';

export type RecoveryDeliveryStatus =
    'queued' | 'sent' | 'failed' | 'locked' | 'unknown' | null;

export type RecoveryState = {
    step?: 'phone' | 'otp' | 'reset';
    maskedPhone?: string | null;
    deliveryStatus?: RecoveryDeliveryStatus;
    resendAvailableAt?: number | null;
    status?: 'expired' | null;
};

export type UseRecoveryFormOptions = {
    recovery?: RecoveryState;
};

export function useRecoveryForm({ recovery }: UseRecoveryFormOptions = {}) {
    const state = recovery ?? { step: 'phone' as const };
    const step = state.step ?? 'phone';
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
            updateUrl: update.url(),
            restartUrl: recoverPage({ query: { restart: 1 } }),
            loginUrl: login(),
            registerUrl: register(),
        },
    };
}
