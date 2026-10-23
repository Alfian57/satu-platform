import { Form } from '@inertiajs/react';
import { ErrorSummary } from '@/components/common/error-summary';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { RecoveryState } from '@/pages/auth/recover/_hooks/use-recovery-form';
import { start } from '@/routes/recover';

type Props = {
    status?: RecoveryState['status'];
};

export default function RecoveryPhoneStep({ status }: Props) {
    return (
        <Form
            action={start.url()}
            method="post"
            className="flex flex-col gap-6"
        >
            {({ processing, errors }) => (
                <>
                    <div data-test="recovery-error-summary">
                        <ErrorSummary
                            errors={errors}
                            title="Permintaan belum dapat diproses"
                        />
                    </div>

                    <div className="grid min-w-0 gap-1.5">
                        <Label htmlFor="phone" required>
                            Nomor WhatsApp
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            name="phone"
                            required
                            autoFocus
                            autoComplete="tel"
                            inputMode="numeric"
                            placeholder="08xxxxxxxxxx"
                            aria-describedby={
                                errors.phone
                                    ? 'recovery-phone-help recover-phone-error'
                                    : 'recovery-phone-help'
                            }
                            aria-invalid={Boolean(errors.phone)}
                        />
                        <div className="grid min-w-0 gap-0.5">
                            <p
                                id="recovery-phone-help"
                                className="text-xs leading-normal text-muted-foreground"
                            >
                                Masukkan nomor yang pernah diverifikasi. Jika
                                terdaftar, kode recovery akan dikirim melalui
                                WhatsApp.
                            </p>
                            <InputError
                                id="recover-phone-error"
                                message={errors.phone}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full cursor-pointer disabled:cursor-not-allowed"
                        disabled={processing}
                        data-test="recovery-start-button"
                    >
                        {processing && <Spinner />}
                        Kirim kode pemulihan
                    </Button>

                    {status === 'expired' && (
                        <p
                            role="status"
                            className="rounded-md border border-pending/35 bg-pending-subtle px-3 py-2 text-sm text-pending-subtle-foreground"
                        >
                            Sesi pemulihan sudah berakhir. Minta kode baru untuk
                            melanjutkan dengan aman.
                        </p>
                    )}
                </>
            )}
        </Form>
    );
}
