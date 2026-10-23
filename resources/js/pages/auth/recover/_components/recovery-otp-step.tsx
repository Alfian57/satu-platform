import { Form, Link } from '@inertiajs/react';
import { ErrorSummary } from '@/components/common/error-summary';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import OtpInput from '@/pages/auth/_components/otp-input';
import RecoveryDeliveryStatus from '@/pages/auth/recover/_components/recovery-delivery-status';
import type { RecoveryState } from '@/pages/auth/recover/_hooks/use-recovery-form';
import { recover as recoverPage } from '@/routes';
import { resend, verify } from '@/routes/recover/otp';

type Props = {
    recovery: RecoveryState;
    otp: string;
    setOtp: (val: string) => void;
    secondsLeft: number;
    canVerify: boolean;
};

export default function RecoveryOtpStep({
    recovery,
    otp,
    setOtp,
    secondsLeft,
    canVerify,
}: Props) {
    const maskedPhone = recovery.maskedPhone ?? 'nomor WhatsApp Anda';

    return (
        <div className="grid gap-6" data-test="recovery-otp-step">
            <div className="grid gap-2 border-y border-border py-4">
                <p className="font-label text-label text-muted-foreground">
                    Bukti pemulihan
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
                        <div data-test="recovery-error-summary">
                            <ErrorSummary
                                errors={errors}
                                title="Permintaan belum dapat diproses"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="recovery-otp">
                                Kode verifikasi
                            </Label>
                            <OtpInput
                                id="recovery-otp"
                                name="otp"
                                value={otp}
                                onChange={setOtp}
                                describedBy={
                                    errors.otp
                                        ? 'recovery-otp-help recovery-otp-error'
                                        : 'recovery-otp-help'
                                }
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
                            disabled={processing || !canVerify}
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
