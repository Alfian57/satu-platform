import { Form, Head, Link } from '@inertiajs/react';
import { RefreshCw, Send, UserPlus } from 'lucide-react';
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

    const isError = status === 'failed' || status === 'locked';

    return (
        <div
            role="status"
            aria-live="polite"
            data-test="register-delivery-status"
        >
            <p
                className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                    isError
                        ? 'border-red-200/60 bg-red-50 text-red-700'
                        : 'border-emerald-200/60 bg-emerald-50 text-emerald-700'
                }`}
            >
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
    const [now, setNow] = useState(() => Date.now());
    const secondsLeft = Math.max(
        0,
        Math.ceil(((registration.resendAvailableAt ?? 0) * 1000 - now) / 1000),
    );
    const maskedPhone = registration.maskedPhone ?? 'nomor WhatsApp Anda';

    useEffect(() => {
        const updateClock = () => setNow(Date.now());
        const timer = window.setInterval(updateClock, 1000);
        document.addEventListener('visibilitychange', updateClock);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', updateClock);
        };
    }, []);

    return (
        <div className="grid gap-6" data-test="register-otp-step">
            {/* Receipt section */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <p className="font-label text-[0.65rem] font-semibold tracking-wider text-blue-600">
                    Bukti verifikasi
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Masukkan kode 6 digit yang dikirim ke{' '}
                    <strong className="text-slate-800">{maskedPhone}</strong>.
                    Kode berlaku 5 menit.
                </p>
            </div>

            <DeliveryStatus
                status={registration.deliveryStatus}
                maskedPhone={maskedPhone}
            />

            <Form action={verify.url()} method="post" resetOnSuccess={['otp']}>
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        <ErrorSummary errors={errors} />

                        <div className="grid gap-2">
                            <Label
                                htmlFor="registration-otp"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Kode verifikasi
                            </Label>
                            <OtpInput
                                id="registration-otp"
                                name="otp"
                                value={otp}
                                onChange={setOtp}
                                describedBy={
                                    errors.otp
                                        ? 'registration-otp-help registration-otp-error'
                                        : 'registration-otp-help'
                                }
                                disabled={processing}
                                autoFocus
                            />
                            <p
                                id="registration-otp-help"
                                className="text-xs leading-relaxed text-slate-600"
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
                            className="h-12 w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md motion-reduce:transition-none"
                            disabled={processing || otp.length !== 6}
                            data-test="register-verify-button"
                        >
                            {processing ? (
                                <Spinner />
                            ) : (
                                <Send
                                    aria-hidden="true"
                                    className="mr-1.5 size-4"
                                />
                            )}
                            Verifikasi nomor WhatsApp
                        </Button>
                    </div>
                )}
            </Form>

            <div className="grid gap-4 border-t border-slate-100 pt-5">
                <Form action={resend.url()} method="post">
                    {({ processing }) => (
                        <div className="grid gap-3">
                            {secondsLeft > 0 ? (
                                <p className="text-center text-sm text-slate-600">
                                    Kirim ulang tersedia dalam{' '}
                                    <span className="font-semibold text-slate-600 tabular-nums">
                                        {secondsLeft} detik
                                    </span>
                                    .
                                </p>
                            ) : (
                                <p
                                    role="status"
                                    aria-live="polite"
                                    className="text-center text-sm text-emerald-600"
                                >
                                    Kirim ulang sudah tersedia.
                                </p>
                            )}
                            <Button
                                type="submit"
                                variant="outline"
                                className="h-11 w-full cursor-pointer rounded-xl border-slate-200 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={processing || secondsLeft > 0}
                                data-test="register-resend-button"
                            >
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <RefreshCw
                                        aria-hidden="true"
                                        className="mr-1.5 size-3.5"
                                    />
                                )}
                                Kirim ulang kode
                            </Button>
                        </div>
                    )}
                </Form>

                <Link
                    href={register({ query: { restart: 1 } })}
                    className="cursor-pointer text-center text-sm font-semibold text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline"
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
                    action={start.url()}
                    method="post"
                    resetOnSuccess={['password', 'password_confirmation']}
                    disableWhileProcessing
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <ErrorSummary errors={errors} />

                            <div className="grid gap-5">
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="name"
                                        className="text-sm font-semibold text-slate-700"
                                    >
                                        Nama
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        autoComplete="name"
                                        name="name"
                                        placeholder="Masukkan nama lengkap"
                                        className="h-12 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        aria-invalid={Boolean(errors.name)}
                                        aria-describedby={
                                            errors.name
                                                ? 'register-name-error'
                                                : undefined
                                        }
                                    />
                                    <InputError
                                        id="register-name-error"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="username"
                                        className="text-sm font-semibold text-slate-700"
                                    >
                                        Nama pengguna
                                    </Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        required
                                        autoComplete="username"
                                        name="username"
                                        placeholder="Masukkan nama pengguna"
                                        aria-describedby={
                                            errors.username
                                                ? 'register-username-help register-username-error'
                                                : 'register-username-help'
                                        }
                                        className="h-12 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        aria-invalid={Boolean(errors.username)}
                                    />
                                    <p
                                        id="register-username-help"
                                        className="text-xs leading-relaxed text-slate-500"
                                    >
                                        Nama pengguna hanya untuk masuk ke SATU,
                                        bukan untuk profil publik.
                                    </p>
                                    <InputError
                                        id="register-username-error"
                                        message={errors.username}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="phone"
                                        className="text-sm font-semibold text-slate-700"
                                    >
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
                                        aria-describedby={
                                            errors.phone
                                                ? 'register-phone-help register-phone-error'
                                                : 'register-phone-help'
                                        }
                                        className="h-12 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        aria-invalid={Boolean(errors.phone)}
                                    />
                                    <p
                                        id="register-phone-help"
                                        className="text-xs leading-relaxed text-slate-500"
                                    >
                                        Dipakai untuk verifikasi. Setelah
                                        dikirim, nomor akan ditampilkan secara
                                        tersamar.
                                    </p>
                                    <InputError
                                        id="register-phone-error"
                                        message={errors.phone}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password"
                                        className="text-sm font-semibold text-slate-700"
                                    >
                                        Password
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        required
                                        autoComplete="new-password"
                                        name="password"
                                        placeholder="Masukkan password"
                                        passwordrules={passwordRules}
                                        className="h-12 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        aria-invalid={Boolean(errors.password)}
                                        aria-describedby={
                                            errors.password
                                                ? 'register-password-error'
                                                : undefined
                                        }
                                    />
                                    <InputError
                                        id="register-password-error"
                                        message={errors.password}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password_confirmation"
                                        className="text-sm font-semibold text-slate-700"
                                    >
                                        Konfirmasi password
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        required
                                        autoComplete="new-password"
                                        name="password_confirmation"
                                        placeholder="Ulangi password"
                                        passwordrules={passwordRules}
                                        className="h-12 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        aria-invalid={Boolean(
                                            errors.password_confirmation,
                                        )}
                                        aria-describedby={
                                            errors.password_confirmation
                                                ? 'register-password_confirmation-error'
                                                : undefined
                                        }
                                    />
                                    <InputError
                                        id="register-password_confirmation-error"
                                        message={errors.password_confirmation}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-start gap-2.5 pt-1">
                                        <input
                                            id="terms_accepted"
                                            type="checkbox"
                                            name="terms_accepted"
                                            required
                                            aria-invalid={Boolean(errors.terms_accepted)}
                                            aria-describedby={
                                                errors.terms_accepted
                                                    ? 'register-terms-error'
                                                    : undefined
                                            }
                                            className="mt-0.5 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <Label
                                            htmlFor="terms_accepted"
                                            className="text-xs leading-relaxed font-normal text-slate-600 cursor-pointer"
                                        >
                                            Saya menyetujui Ketentuan Layanan dan Kebijakan Privasi SATU v1.0.
                                        </Label>
                                    </div>
                                    <InputError
                                        id="register-terms-error"
                                        message={errors.terms_accepted}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="mt-2 h-12 w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md motion-reduce:transition-none"
                                    disabled={processing}
                                    data-test="register-user-button"
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <UserPlus
                                            aria-hidden="true"
                                            className="mr-1.5 size-4"
                                        />
                                    )}
                                    Kirim kode verifikasi
                                </Button>
                            </div>

                            {state.status === 'expired' && (
                                <p
                                    role="status"
                                    className="rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 text-sm text-amber-700"
                                >
                                    Sesi verifikasi sudah berakhir. Data yang
                                    aman dapat dimasukkan kembali untuk meminta
                                    kode baru.
                                </p>
                            )}

                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <span className="relative bg-white px-4 text-xs text-slate-600">
                                    atau
                                </span>
                            </div>

                            <div className="text-center text-sm text-slate-500">
                                Sudah punya akun?{' '}
                                <TextLink
                                    href={login()}
                                    className="font-semibold text-blue-600 no-underline hover:text-blue-700 hover:underline"
                                >
                                    Masuk
                                </TextLink>
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
        'Buat akun mahasiswa dengan username login-only dan nomor WhatsApp terverifikasi.',
};
