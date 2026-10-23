import { Form } from '@inertiajs/react';
import { ErrorSummary } from '@/components/common/error-summary';
import InputError from '@/components/common/input-error';
import PasswordInput from '@/components/common/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/recover/password';

export default function RecoveryResetStep() {
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
                            Pemulihan terverifikasi
                        </p>
                        <p className="text-sm leading-relaxed">
                            Buat password baru. Setelah tersimpan, masuk kembali
                            menggunakan username dan password baru.
                        </p>
                    </div>

                    <div data-test="recovery-error-summary">
                        <ErrorSummary
                            errors={errors}
                            title="Permintaan belum dapat diproses"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password baru</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            required
                            autoFocus
                            autoComplete="new-password"
                            placeholder="Password baru"
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={
                                errors.password
                                    ? 'recover-password-error'
                                    : undefined
                            }
                        />
                        <InputError
                            id="recover-password-error"
                            message={errors.password}
                        />
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
                            aria-invalid={Boolean(errors.password_confirmation)}
                            aria-describedby={
                                errors.password_confirmation
                                    ? 'recover-password_confirmation-error'
                                    : undefined
                            }
                        />
                        <InputError
                            id="recover-password_confirmation-error"
                            message={errors.password_confirmation}
                        />
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
