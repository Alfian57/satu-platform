import { Form, Link } from '@inertiajs/react';
import { RefreshCw, Send } from 'lucide-react';
import DeliveryStatus from '@/components/auth/delivery-status';
import OtpInput from '@/components/auth/otp-input';
import RequiredMark from '@/components/auth/required-mark';
import { ErrorSummary } from '@/components/common/error-summary';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { RegistrationState } from '@/hooks/use-register-form';
import { register } from '@/routes';
import { resend, verify } from '@/routes/register/otp';

type Props = {
    registration: RegistrationState;
    otp: string;
    setOtp: (value: string) => void;
    secondsLeft: number;
    canVerify: boolean;
};

export default function RegistrationOtpStep({
    registration,
    otp,
    setOtp,
    secondsLeft,
    canVerify,
}: Props) {
    const maskedPhone = registration.maskedPhone ?? 'nomor WhatsApp Anda';

    return (
        <div className="grid gap-4" data-test="register-otp-step">
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
                    <div className="grid gap-4">
                        <div data-test="register-error-summary">
                            <ErrorSummary
                                errors={errors}
                                title="Data belum dapat diproses"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="registration-otp"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Kode verifikasi
                                <RequiredMark />
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
                            className="h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md motion-reduce:transition-none"
                            disabled={processing || !canVerify}
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

            <div className="grid gap-3 border-t border-slate-100 pt-4">
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
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center text-center text-sm font-semibold text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline"
                    data-test="register-change-phone"
                >
                    Ganti nomor WhatsApp
                </Link>
            </div>
        </div>
    );
}
