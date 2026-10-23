import { KeyRound, Save } from 'lucide-react';
import InputError from '@/components/common/input-error';
import PasswordInput from '@/components/common/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { SettingsFormFeedback } from '@/pages/settings/_components/settings-form-feedback';
import { SettingsCardHeading } from '@/pages/settings/_components/settings-panel';

export interface SecurityPasswordFormProps {
    data: {
        current_password: string;
        password: string;
        password_confirmation: string;
    };
    errors: Record<string, string | undefined>;
    processing: boolean;
    actionError: string | null;
    minimumLength?: string;
    passwordRules: string;
    onCurrentPasswordChange: (val: string) => void;
    onPasswordChange: (val: string) => void;
    onPasswordConfirmationChange: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function SecurityPasswordForm({
    data,
    errors,
    processing,
    actionError,
    minimumLength,
    passwordRules,
    onCurrentPasswordChange,
    onPasswordChange,
    onPasswordConfirmationChange,
    onSubmit,
}: SecurityPasswordFormProps) {
    return (
        <section
            aria-labelledby="security-settings-title"
            className="grid min-w-0 gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
            data-test="security-settings-card"
        >
            <SettingsCardHeading
                id="security-settings-title"
                icon={KeyRound}
                title="Perbarui password"
            />
            <form
                onSubmit={onSubmit}
                className="grid min-w-0 gap-5 border-t border-border pt-5"
                aria-busy={processing}
            >
                <SettingsFormFeedback
                    errors={errors as Record<string, string>}
                    actionError={actionError}
                    processing={processing}
                    prefix="security-settings"
                    errorHint={
                        Object.keys(errors).length > 0
                            ? 'Kolom password dikosongkan setelah validasi gagal. Isi ulang sebelum mencoba kembali.'
                            : 'Password tidak disimpan pada penyimpanan browser. Jangan bagikan kepada orang lain.'
                    }
                />
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="current_password" required>
                        Password saat ini
                    </Label>
                    <PasswordInput
                        id="current_password"
                        name="current_password"
                        disabled={processing}
                        value={data.current_password}
                        onChange={(event) =>
                            onCurrentPasswordChange(event.target.value)
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
                    <div className="grid min-w-0 gap-0.5">
                        <p
                            id="current-password-help"
                            className="text-xs leading-normal text-muted-foreground"
                        >
                            Memastikan perubahan dilakukan oleh pemilik akun.
                        </p>
                        <InputError
                            id="current-password-error"
                            message={errors.current_password}
                            className="text-correction-subtle-foreground"
                        />
                    </div>
                </div>
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="password" required>
                        Password baru
                    </Label>
                    <PasswordInput
                        id="password"
                        name="password"
                        disabled={processing}
                        value={data.password}
                        onChange={(event) =>
                            onPasswordChange(event.target.value)
                        }
                        className="h-11 bg-background/60 pr-12 [&+button]:w-11 [&+button]:justify-center"
                        autoComplete="new-password"
                        required
                        placeholder="Masukkan password baru"
                        passwordrules={passwordRules}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={
                            errors.password
                                ? 'password-help password-error'
                                : 'password-help'
                        }
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <p
                            id="password-help"
                            className="text-xs leading-normal text-muted-foreground"
                        >
                            {minimumLength
                                ? 'Minimal ' + minimumLength + ' karakter. '
                                : ''}
                            Gunakan kata atau kombinasi yang sulit ditebak.
                            Validasi akhir mengikuti aturan sistem.
                        </p>
                        <InputError
                            id="password-error"
                            message={errors.password}
                            className="text-correction-subtle-foreground"
                        />
                    </div>
                </div>
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="password_confirmation" required>
                        Konfirmasi password baru
                    </Label>
                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        disabled={processing}
                        value={data.password_confirmation}
                        onChange={(event) =>
                            onPasswordConfirmationChange(event.target.value)
                        }
                        className="h-11 bg-background/60 pr-12 [&+button]:w-11 [&+button]:justify-center"
                        autoComplete="new-password"
                        required
                        placeholder="Ulangi password baru"
                        passwordrules={passwordRules}
                        aria-invalid={Boolean(errors.password_confirmation)}
                        aria-describedby={
                            errors.password_confirmation
                                ? 'password-confirmation-help password-confirmation-error'
                                : 'password-confirmation-help'
                        }
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <p
                            id="password-confirmation-help"
                            className="text-xs leading-normal text-muted-foreground"
                        >
                            Harus sama dengan password baru yang kamu masukkan.
                        </p>
                        <InputError
                            id="password-confirmation-error"
                            message={errors.password_confirmation}
                            className="text-correction-subtle-foreground"
                        />
                    </div>
                </div>
                <div className="flex min-w-0 justify-end pt-2">
                    <Button
                        disabled={processing}
                        className="min-h-10 w-full cursor-pointer justify-center disabled:cursor-not-allowed sm:w-48"
                        data-test="update-password-button"
                    >
                        {processing ? <Spinner /> : <Save aria-hidden="true" />}
                        {processing ? 'Memperbarui...' : 'Perbarui password'}
                    </Button>
                </div>
            </form>
        </section>
    );
}
