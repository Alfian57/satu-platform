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
import { login, register } from '@/routes';
import { start } from '@/routes/register';
import { resend, verify } from '@/routes/register/otp';

type RegistrationState = {
    step?: 'details' | 'otp';
    maskedPhone?: string | null;
    deliveryStatus?: 'queued' | 'sent' | 'failed' | 'locked' | null;
    resendAvailableAt?: number | null;
    status?: 'expired' | null;
};

type Props = {
    passwordRules: string;
    registration?: RegistrationState;
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
        <div ref={summaryRef} tabIndex={-1} data-test="register-error-summary">
            <AlertError title="Data belum dapat diproses" errors={messages} />
        </div>
    );
}

function DeliveryStatus({
    status,
    maskedPhone,
}: {
    status: RegistrationState['deliveryStatus'];
    maskedPhone: string;
}) {
    const copy = {
        queued: 'Permintaan pengiriman kode sedang diproses.',
        sent: `Kode dikirim ke WhatsApp ${maskedPhone}.`,
        failed: 'Pengiriman gagal. Periksa nomor atau coba kirim ulang.',
        locked: 'Batas percobaan kode tercapai. Minta kode baru setelah jeda selesai.',
    }[status ?? 'queued'];

    return (
        <div
            role="status"
            aria-live="polite"
            className={
                status === 'failed' || status === 'locked'
                    ? 'border-correction/35 bg-correction-subtle text-correction-subtle-foreground'
                    : 'border-verified/35 bg-verified-subtle text-verified-subtle-foreground'
            }
            data-test="register-delivery-status"
        >
            <p className="rounded-md border px-3 py-2 text-sm leading-relaxed">
                {copy}
            </p>
        </div>
    );
}

function RegistrationOtpStep({
    registration,
}: {
    registration: RegistrationState;
}) {
    const [otp, setOtp] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(() =>
        Math.max(
            0,
            (registration.resendAvailableAt ?? 0) -
                Math.floor(Date.now() / 1000),
        ),
    );
    const maskedPhone = registration.maskedPhone ?? 'nomor WhatsApp Anda';

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
        <div className="grid gap-6" data-test="register-otp-step">
            <div className="grid gap-2 border-y border-border py-4">
                <p className="font-label text-label text-muted-foreground">
                    Receipt verifikasi
                </p>
                <p className="text-sm leading-relaxed">
                    Masukkan kode 6 digit yang dikirim ke{' '}
                    <strong>{maskedPhone}</strong>. Kode berlaku 5 menit.
                </p>
            </div>

            <DeliveryStatus
                status={registration.deliveryStatus}
                maskedPhone={maskedPhone}
            />

            <Form {...verify.form()} resetOnSuccess={['otp']}>
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        <ErrorSummary errors={errors} />

                        <div className="grid gap-2">
                            <Label htmlFor="registration-otp">
                                Kode verifikasi
                            </Label>
                            <OtpInput
                                id="registration-otp"
                                name="otp"
                                value={otp}
                                onChange={setOtp}
                                describedBy="registration-otp-help registration-otp-error"
                                disabled={processing}
                                autoFocus
                            />
                            <p
                                id="registration-otp-help"
                                className="text-xs leading-relaxed text-muted-foreground"
                            >
                                Anda dapat menempelkan seluruh kode sekaligus.
                            </p>
                            <InputError
                                id="registration-otp-error"
                                message={errors.otp}
                            />
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full cursor-pointer disabled:cursor-not-allowed"
                            disabled={processing || otp.length !== 6}
                            data-test="register-verify-button"
                        >
                            {processing && <Spinner />}
                            Verifikasi nomor WhatsApp
                        </Button>
                    </div>
                )}
            </Form>

            <div className="grid gap-3 border-t border-border pt-5 text-sm">
                <Form {...resend.form()}>
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
                                data-test="register-resend-button"
                            >
                                {processing && <Spinner />}
                                Kirim ulang kode
                            </Button>
                        </div>
                    )}
                </Form>

                <Link
                    href={register({ query: { restart: 1 } })}
                    className="cursor-pointer text-center font-semibold text-primary underline-offset-4 hover:underline"
                    data-test="register-change-phone"
                >
                    Ganti nomor WhatsApp
                </Link>
            </div>
        </div>
    );
}

export default function Register({ passwordRules, registration }: Props) {
    const state = registration ?? { step: 'details' as const };

    return (
        <>
            <Head title="Daftar" />

            {state.step === 'otp' ? (
                <RegistrationOtpStep registration={state} />
            ) : (
                <Form
                    {...start.form()}
                    resetOnSuccess={['password', 'password_confirmation']}
                    disableWhileProcessing
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <ErrorSummary errors={errors} />

                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        autoComplete="name"
                                        name="name"
                                        placeholder="Nama lengkap"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="username">
                                        Nama pengguna
                                    </Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        required
                                        autoComplete="username"
                                        name="username"
                                        placeholder="nama_pengguna"
                                        aria-describedby="register-username-help"
                                    />
                                    <p
                                        id="register-username-help"
                                        className="text-xs leading-relaxed text-muted-foreground"
                                    >
                                        Nama pengguna hanya untuk masuk ke SATU,
                                        bukan untuk profil publik.
                                    </p>
                                    <InputError message={errors.username} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="phone">
                                        Nomor WhatsApp
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        required
                                        autoComplete="tel"
                                        inputMode="numeric"
                                        name="phone"
                                        placeholder="08xxxxxxxxxx"
                                        aria-describedby="register-phone-help"
                                    />
                                    <p
                                        id="register-phone-help"
                                        className="text-xs leading-relaxed text-muted-foreground"
                                    >
                                        Dipakai untuk verifikasi. Setelah
                                        dikirim, nomor akan ditampilkan secara
                                        tersamar.
                                    </p>
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput
                                        id="password"
                                        required
                                        autoComplete="new-password"
                                        name="password"
                                        placeholder="Password"
                                        passwordrules={passwordRules}
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Konfirmasi password
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        required
                                        autoComplete="new-password"
                                        name="password_confirmation"
                                        placeholder="Konfirmasi password"
                                        passwordrules={passwordRules}
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="mt-2 w-full cursor-pointer disabled:cursor-not-allowed"
                                    disabled={processing}
                                    data-test="register-user-button"
                                >
                                    {processing && <Spinner />}
                                    Kirim kode verifikasi
                                </Button>
                            </div>

                            {state.status === 'expired' && (
                                <p
                                    role="status"
                                    className="rounded-md border border-pending/35 bg-pending-subtle px-3 py-2 text-sm text-pending-subtle-foreground"
                                >
                                    Sesi verifikasi sudah berakhir. Data yang
                                    aman dapat dimasukkan kembali untuk meminta
                                    kode baru.
                                </p>
                            )}

                            <div className="text-center text-sm text-muted-foreground">
                                Sudah punya akun?{' '}
                                <TextLink href={login()}>Masuk</TextLink>
                            </div>
                        </>
                    )}
                </Form>
            )}
        </>
    );
}

Register.layout = {
    title: 'Buat akun',
    description:
        'Buat akun student dengan username login-only dan nomor WhatsApp terverifikasi.',
};
