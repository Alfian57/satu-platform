import { Head, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    KeyRound,
    LockKeyhole,
    Save,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { SettingsFormFeedback } from '@/components/settings/settings-form-feedback';
import {
    SettingsCardHeading,
    SettingsGrid,
    SettingsHelpCard,
} from '@/components/settings/settings-panel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { edit } from '@/routes/security';

export default function Security({ passwordRules }: { passwordRules: string }) {
    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const { errors, processing, recentlySuccessful } = form;
    const [actionError, setActionError] = useState<string | null>(null);
    const minimumLength = /minlength:\s*(\d+)/.exec(passwordRules)?.[1];

    return (
        <>
            <Head title="Pengaturan keamanan" />
            <SettingsGrid>
                <section
                    aria-labelledby="security-settings-title"
                    className="grid min-w-0 gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
                    data-test="security-settings-card"
                >
                    <SettingsCardHeading
                        id="security-settings-title"
                        icon={KeyRound}
                        title="Perbarui password"
                        description="Gunakan password yang panjang, unik, dan tidak digunakan di layanan lain."
                    />
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (processing) {
                                return;
                            }

                            form.submit(SecurityController.update(), {
                                preserveScroll: true,
                                onStart: () => setActionError(null),
                                onError: () =>
                                    form.reset(
                                        'password',
                                        'password_confirmation',
                                        'current_password',
                                    ),
                                onSuccess: () => form.reset(),
                                onNetworkError: () => {
                                    setActionError(
                                        'Koneksi terputus. Perubahan password belum dapat dikonfirmasi. Periksa koneksi dan status akun sebelum mencoba lagi.',
                                    );

                                    return false;
                                },
                                onHttpException: (response) => {
                                    setActionError(
                                        [401, 403, 419].includes(
                                            response.status,
                                        )
                                            ? 'Sesi atau akses perubahan tidak tersedia. Muat ulang halaman sebelum mencoba lagi.'
                                            : response.status === 429
                                              ? 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.'
                                              : 'Respons perubahan password belum tersedia. Periksa status akun sebelum mencoba lagi.',
                                    );

                                    return false;
                                },
                            });
                        }}
                        className="grid min-w-0 gap-6 border-t border-border pt-6"
                    >
                        <SettingsFormFeedback
                            errors={errors}
                            actionError={actionError}
                            processing={processing}
                            prefix="security-settings"
                            errorHint={
                                Object.keys(errors).length > 0
                                    ? 'Kolom password dikosongkan setelah validasi gagal. Isi ulang sebelum mencoba kembali.'
                                    : 'Password tidak disimpan pada penyimpanan browser. Jangan bagikan kepada orang lain.'
                            }
                            success={
                                recentlySuccessful
                                    ? 'Password berhasil diperbarui. Gunakan password baru pada login berikutnya.'
                                    : null
                            }
                        />
                        <div className="grid min-w-0 gap-3">
                            <Label htmlFor="current_password">
                                Password saat ini
                            </Label>
                            <PasswordInput
                                id="current_password"
                                name="current_password"
                                disabled={processing}
                                value={form.data.current_password}
                                onChange={(event) =>
                                    form.setData(
                                        'current_password',
                                        event.target.value,
                                    )
                                }
                                className="h-11 bg-background/60 pr-12 [&+button]:w-11 [&+button]:justify-center"
                                autoComplete="current-password"
                                required
                                placeholder="Masukkan password saat ini"
                                aria-invalid={Boolean(errors.current_password)}
                                aria-describedby={
                                    errors.current_password
                                        ? 'current-password-help current-password-error'
                                        : 'current-password-help'
                                }
                            />
                            <p
                                id="current-password-help"
                                className="text-xs leading-5 text-muted-foreground"
                            >
                                Memastikan perubahan dilakukan oleh pemilik
                                akun.
                            </p>
                            <InputError
                                id="current-password-error"
                                message={errors.current_password}
                                className="text-correction-subtle-foreground"
                            />
                        </div>
                        <div className="grid min-w-0 gap-5 rounded-2xl border border-primary/10 bg-accent/40 p-4 sm:p-5">
                            <div className="grid min-w-0 gap-3">
                                <Label htmlFor="password">Password baru</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    disabled={processing}
                                    value={form.data.password}
                                    onChange={(event) =>
                                        form.setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 bg-card pr-12 [&+button]:w-11 [&+button]:justify-center"
                                    autoComplete="new-password"
                                    required
                                    placeholder="Buat password yang unik"
                                    passwordrules={passwordRules}
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby={
                                        errors.password
                                            ? 'password-help password-error'
                                            : 'password-help'
                                    }
                                />
                                <p
                                    id="password-help"
                                    className="text-xs leading-6 text-muted-foreground"
                                >
                                    {minimumLength
                                        ? 'Minimal ' +
                                          minimumLength +
                                          ' karakter. '
                                        : ''}
                                    Gunakan kata atau kombinasi yang sulit
                                    ditebak. Validasi akhir mengikuti aturan
                                    sistem.
                                </p>
                                <InputError
                                    id="password-error"
                                    message={errors.password}
                                    className="text-correction-subtle-foreground"
                                />
                            </div>
                            <div className="grid min-w-0 gap-3">
                                <Label htmlFor="password_confirmation">
                                    Konfirmasi password baru
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    disabled={processing}
                                    value={form.data.password_confirmation}
                                    onChange={(event) =>
                                        form.setData(
                                            'password_confirmation',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 bg-card pr-12 [&+button]:w-11 [&+button]:justify-center"
                                    autoComplete="new-password"
                                    required
                                    placeholder="Ulangi password baru"
                                    passwordrules={passwordRules}
                                    aria-invalid={Boolean(
                                        errors.password_confirmation,
                                    )}
                                    aria-describedby={
                                        errors.password_confirmation
                                            ? 'password-confirmation-help password-confirmation-error'
                                            : 'password-confirmation-help'
                                    }
                                />
                                <p
                                    id="password-confirmation-help"
                                    className="text-xs leading-5 text-muted-foreground"
                                >
                                    Harus sama dengan password baru yang kamu
                                    masukkan.
                                </p>
                                <InputError
                                    id="password-confirmation-error"
                                    message={errors.password_confirmation}
                                    className="text-correction-subtle-foreground"
                                />
                            </div>
                        </div>
                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                            <p className="text-xs leading-6 text-muted-foreground">
                                Kolom password dikosongkan setelah berhasil
                                diperbarui.
                            </p>
                            <Button
                                disabled={processing}
                                className="min-h-11 w-full sm:w-auto"
                                data-test="update-password-button"
                            >
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <Save aria-hidden="true" />
                                )}
                                {processing
                                    ? 'Memperbarui...'
                                    : 'Perbarui password'}
                            </Button>
                        </div>
                    </form>
                </section>
                <SettingsHelpCard
                    icon={ShieldCheck}
                    eyebrow="Kebiasaan sederhana"
                    title="Jaga akses pribadimu"
                >
                    <ul className="grid gap-4 text-sm leading-6 text-muted-foreground">
                        <li className="flex items-start gap-3">
                            <LockKeyhole
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0 text-primary"
                            />
                            <span>
                                Jangan bagikan password, termasuk kepada teman
                                satu tim atau pihak yang mengaku sebagai
                                petugas.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle2
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0 text-primary"
                            />
                            <span>
                                Password manager dapat membantu menyimpan
                                password yang unik untuk setiap layanan.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <KeyRound
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0 text-primary"
                            />
                            <span>
                                Periksa ulang password baru sebelum menyimpan.
                                Tombol mata dapat menampilkan atau
                                menyembunyikan isian.
                            </span>
                        </li>
                    </ul>
                    <p className="rounded-2xl border border-primary/10 bg-accent/60 p-4 text-xs leading-6 text-muted-foreground">
                        Mengubah password tidak mengubah karya, afiliasi kampus,
                        atau pilihan visibilitasmu.
                    </p>
                </SettingsHelpCard>
            </SettingsGrid>
        </>
    );
}
Security.layout = {
    breadcrumbs: [{ title: 'Pengaturan keamanan', href: edit() }],
};
