import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import AuthInputFrame from '@/components/auth/auth-input-frame';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { SettingsFormFeedback } from '@/components/settings/settings-form-feedback';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';
import { edit as editProfile } from '@/routes/profile';

export default function ConfirmPasswordForm() {
    const form = useForm({ password: '' });
    const { processing, errors } = form;
    const [actionError, setActionError] = useState<string | null>(null);

    return (
        <form
            className="grid gap-4 sm:gap-5"
            onSubmit={(event) => {
                event.preventDefault();

                if (processing) {
                    return;
                }

                form.submit(store(), {
                    onStart: () => {
                        setActionError(null);
                        form.clearErrors();
                    },
                    onSuccess: () => form.reset('password'),
                    onError: () => form.reset('password'),
                    onNetworkError: () => {
                        setActionError(
                            'Koneksi terputus. Konfirmasi belum dapat dipastikan. Periksa koneksi dan muat ulang halaman sebelum mencoba lagi.',
                        );

                        return false;
                    },
                    onHttpException: (response) => {
                        setActionError(
                            [401, 403, 419].includes(response.status)
                                ? 'Sesi atau akses konfirmasi tidak tersedia. Muat ulang halaman, lalu masuk kembali jika diminta.'
                                : response.status === 429
                                  ? 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba kembali.'
                                  : 'Respons konfirmasi belum tersedia. Muat ulang halaman untuk memeriksa akses sebelum mencoba lagi.',
                        );

                        return false;
                    },
                });
            }}
        >
            <div className="grid gap-3.5 sm:gap-4" aria-busy={processing}>
                <SettingsFormFeedback
                    errors={errors}
                    actionError={actionError}
                    actionErrorTitle="Konfirmasi belum dapat dipastikan."
                    processing={processing}
                    prefix="confirm-password"
                    errorHint={
                        Object.keys(errors).length > 0
                            ? 'Kolom password dikosongkan setelah validasi gagal. Isi ulang untuk melanjutkan.'
                            : 'Konfirmasi ini tidak mengganti password atau menjalankan perubahan akun.'
                    }
                />
                <div className="flex items-start gap-2.5 rounded-2xl border border-satu-orange-border bg-satu-orange-soft p-3 text-xs leading-relaxed text-muted-foreground sm:p-3.5 sm:text-sm">
                    <LockKeyhole
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-satu-orange-ink sm:size-5"
                    />
                    <p>
                        Halaman tujuan memerlukan konfirmasi ulang. Setelah
                        berhasil, kamu akan melanjutkan ke halaman tersebut.
                    </p>
                </div>
                <div className="grid gap-2 sm:gap-2.5">
                    <Label htmlFor="password" className="text-sm font-semibold">
                        Password saat ini{' '}
                        <span
                            aria-hidden="true"
                            className="auth-required-marker"
                        >
                            *
                        </span>
                    </Label>
                    <AuthInputFrame icon={LockKeyhole}>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={form.data.password}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                            placeholder="Masukkan password akunmu"
                            autoComplete="current-password"
                            autoFocus
                            required
                            disabled={processing}
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={
                                errors.password
                                    ? 'confirm-password-help confirm-password-password-error'
                                    : 'confirm-password-help'
                            }
                            className="h-11 rounded-xl border-input bg-white text-base"
                        />
                    </AuthInputFrame>
                    <p
                        id="confirm-password-help"
                        className="text-xs leading-5 text-muted-foreground"
                    >
                        Wajib diisi. Gunakan password yang kamu pakai untuk
                        masuk, bukan password baru.
                    </p>

                    <InputError
                        id="confirm-password-password-error"
                        message={errors.password}
                    />
                </div>

                <div className="grid gap-3">
                    <Button
                        type="submit"
                        className="auth-submit-static min-h-11 w-full cursor-pointer disabled:cursor-not-allowed"
                        disabled={processing}
                        data-test="confirm-password-button"
                    >
                        {processing ? (
                            <Spinner />
                        ) : (
                            <ArrowRight aria-hidden="true" className="size-4" />
                        )}
                        {processing
                            ? 'Memeriksa...'
                            : 'Konfirmasi dan lanjutkan'}
                    </Button>
                    <Link
                        href={editProfile()}
                        className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        Kembali ke pengaturan akun
                    </Link>
                </div>
            </div>
        </form>
    );
}
