import { Form, Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AlertError from '@/components/alert-error';
import OtpInput from '@/components/auth/otp-input';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login, recover as recoverPage, register } from '@/routes';
import { start } from '@/routes/recover';
import { resend, verify } from '@/routes/recover/otp';
import { update } from '@/routes/recover/password';

type RecoveryState = {
    step?: 'phone' | 'otp' | 'reset';
    maskedPhone?: string | null;
    deliveryStatus?: 'queued' | 'sent' | 'failed' | 'locked' | 'unknown' | null;
    resendAvailableAt?: number | null;
    status?: 'expired' | null;
};

type Props = {
    recovery?: RecoveryState;
};

function ErrorSummary({ errors }: { errors: Record<string, string> }) {
    const summaryRef = useRef<HTMLDivElement>(null);
    const messages = Object.values(errors);

    useEffect(() => {
        if (messages.length > 0) {
            window.requestAnimationFrame(() => summaryRef.current?.focus());
        }
    }, [messages.length]);

    if (messages.length === 0) {
        return null;
    }

    return (
        <div ref={summaryRef} tabIndex={-1} data-test="recovery-error-summary">
            <AlertError
                title="Permintaan belum dapat diproses"
                errors={messages}
            />
        </div>
    );
}

function RecoveryDeliveryStatus({
    status,
    maskedPhone,
}: {
    status: RecoveryState['deliveryStatus'];
    maskedPhone: string;
}) {
    const copy = {
        queued: `Jika nomor ${maskedPhone} terdaftar, kode akan segera dikirim ke WhatsApp.`,
        sent: `Jika nomor ${maskedPhone} terdaftar, kode verifikasi sudah dikirim ke WhatsApp.`,
        failed: 'Pengiriman belum berhasil. Coba kirim ulang setelah jeda selesai.',
        locked: 'Batas percobaan kode tercapai. Minta kode baru setelah jeda selesai.',
        unknown: `Jika nomor ${maskedPhone} terdaftar, kode akan dikirim ke WhatsApp.`,
    }[status ?? 'queued'];

    return (
        <p
            role="status"
            aria-live="polite"
            className={
                status === 'failed' || status === 'locked'
                    ? 'rounded-md border border-correction/35 bg-correction-subtle px-3 py-2 text-sm leading-relaxed text-correction-subtle-foreground'
                    : 'rounded-md border border-verified/35 bg-verified-subtle px-3 py-2 text-sm leading-relaxed text-verified-subtle-foreground'
            }
            data-test="recovery-delivery-status"
        >
            {copy}
        </p>
    );
}

function RecoveryOtpStep({ recovery }: { recovery: RecoveryState }) {
    const [otp, setOtp] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(() =>
        Math.max(
            0,
            (recovery.resendAvailableAt ?? 0) - Math.floor(Date.now() / 1000),
        ),
    );
    const maskedPhone = recovery.maskedPhone ?? 'nomor WhatsApp Anda';

    useEffect(() => {
        if (secondsLeft <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setSecondsLeft((current) => Math.max(0, current - 1));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [secondsLeft]);

    return (
        <div className="grid gap-6" data-test="recovery-otp-step">
            <div className="grid gap-2 border-y border-border py-4">
                <p className="font-label text-label text-muted-foreground">
                    Receipt recovery
                </p>
                <p className="text-sm leading-relaxed">
                    Masukkan kode 6 digit. Kode berlaku 5 menit dan hanya dapat
                    digunakan sekali.
                </p>
            </div>

            <RecoveryDeliveryStatus
                status={recovery.deliveryStatus}
                maskedPhone={maskedPhone}
            />

            <Form action={verify.url()} method="post" resetOnSuccess={['otp']}>
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        <ErrorSummary errors={errors} />

                        <div className="grid gap-2">
                            <Label htmlFor="recovery-otp">
                                Kode verifikasi
                            </Label>
                            <OtpInput
                                id="recovery-otp"
                                name="otp"
                                value={otp}
                                onChange={setOtp}
                                describedBy="recovery-otp-help recovery-otp-error"
                                disabled={processing}
                                autoFocus
                            />
                            <p
                                id="recovery-otp-help"
                                className="text-xs leading-relaxed text-muted-foreground"
                            >
                                Tempel kode untuk mengisi enam digit sekaligus.
                            </p>
                            <InputError
                                id="recovery-otp-error"
                                message={errors.otp}
                            />
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full cursor-pointer disabled:cursor-not-allowed"
                            disabled={processing || otp.length !== 6}
                            data-test="recovery-verify-button"
                        >
                            {processing && <Spinner />}
                            Verifikasi dan lanjutkan
                        </Button>
                    </div>
                )}
            </Form>

            <div className="grid gap-3 border-t border-border pt-5 text-sm">
                <Form action={resend.url()} method="post">
                    {({ processing }) => (
                        <div className="grid gap-2">
                            {secondsLeft > 0 ? (
                                <p className="text-muted-foreground">
                                    Kirim ulang tersedia dalam{' '}
                                    <span className="font-semibold tabular-nums">
                                        {secondsLeft} detik
                                    </span>
                                    .
                                </p>
                            ) : (
                                <p role="status" aria-live="polite">
                                    Kirim ulang sudah tersedia.
                                </p>
                            )}
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full cursor-pointer disabled:cursor-not-allowed"
                                disabled={processing || secondsLeft > 0}
                                data-test="recovery-resend-button"
                            >
                                {processing && <Spinner />}
                                Kirim ulang kode
                            </Button>
                        </div>
                    )}
                </Form>

                <Link
                    href={recoverPage({ query: { restart: 1 } })}
                    className="cursor-pointer text-center font-semibold text-primary underline-offset-4 hover:underline"
                    data-test="recovery-change-phone"
                >
                    Gunakan nomor lain
                </Link>
            </div>
        </div>
    );
}

function RecoveryResetStep() {
    return (
        <Form
            action={update.url()}
            method="post"
            resetOnSuccess={['password', 'password_confirmation']}
        >
            {({ processing, errors }) => (
                <div className="grid gap-6" data-test="recovery-reset-step">
                    <div className="grid gap-2 border-y border-border py-4">
                        <p className="font-label text-label text-muted-foreground">
                            Recovery terverifikasi
                        </p>
                        <p className="text-sm leading-relaxed">
                            Buat password baru. Setelah tersimpan, masuk kembali
                            menggunakan username dan password baru.
                        </p>
                    </div>

                    <ErrorSummary errors={errors} />

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password baru</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            required
                            autoFocus
                            autoComplete="new-password"
                            placeholder="Password baru"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Konfirmasi password baru
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            required
                            autoComplete="new-password"
                            placeholder="Ulangi password baru"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full cursor-pointer disabled:cursor-not-allowed"
                        disabled={processing}
                        data-test="recovery-reset-button"
                    >
                        {processing && <Spinner />}
                        Simpan password baru
                    </Button>
                </div>
            )}
        </Form>
    );
}

function RecoveryPhoneStep({ status }: { status: RecoveryState['status'] }) {
    return (
        <Form
            action={start.url()}
            method="post"
            className="flex flex-col gap-6"
        >
            {({ processing, errors }) => (
                <>
                    <ErrorSummary errors={errors} />

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Nomor WhatsApp</Label>
                        <Input
                            id="phone"
                            type="tel"
                            name="phone"
                            required
                            autoFocus
                            autoComplete="tel"
                            inputMode="numeric"
                            placeholder="08xxxxxxxxxx"
                            aria-describedby="recovery-phone-help"
                        />
                        <p
                            id="recovery-phone-help"
                            className="text-xs leading-relaxed text-muted-foreground"
                        >
                            Masukkan nomor yang pernah diverifikasi. Jika
                            terdaftar, kode recovery akan dikirim melalui
                            WhatsApp.
                        </p>
                        <InputError message={errors.phone} />
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full cursor-pointer disabled:cursor-not-allowed"
                        disabled={processing}
                        data-test="recovery-start-button"
                    >
                        {processing && <Spinner />}
                        Kirim kode recovery
                    </Button>

                    {status === 'expired' && (
                        <p
                            role="status"
                            className="rounded-md border border-pending/35 bg-pending-subtle px-3 py-2 text-sm text-pending-subtle-foreground"
                        >
                            Sesi recovery sudah berakhir. Minta kode baru untuk
                            melanjutkan dengan aman.
                        </p>
                    )}
                </>
            )}
        </Form>
    );
}

export default function Recover({ recovery }: Props) {
    const state = recovery ?? { step: 'phone' as const };

    return (
        <>
            <Head title="Recovery akun" />

            {state.step === 'otp' ? (
                <RecoveryOtpStep recovery={state} />
            ) : state.step === 'reset' ? (
                <RecoveryResetStep />
            ) : (
                <RecoveryPhoneStep status={state.status} />
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
                Ingat username dan password?{' '}
                <TextLink href={login()}>Masuk</TextLink>
                <span aria-hidden="true"> · </span>
                <TextLink href={register()}>Daftar</TextLink>
            </div>
        </>
    );
}

Recover.layout = {
    title: 'Pulihkan akun',
    description:
        'Verifikasi nomor WhatsApp untuk membuat password baru. SATU tidak memakai email untuk recovery.',
};
