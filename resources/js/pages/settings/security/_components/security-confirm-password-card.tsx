import { ArrowRight, LockKeyhole } from 'lucide-react';
import InputError from '@/components/common/input-error';
import PasswordInput from '@/components/common/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { SettingsFormFeedback } from '@/pages/settings/_components/settings-form-feedback';
import { SettingsCardHeading } from '@/pages/settings/_components/settings-panel';

export interface SecurityConfirmPasswordCardProps {
    data: { password: string };
    errors: Record<string, string | undefined>;
    processing: boolean;
    actionError: string | null;
    onPasswordChange: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function SecurityConfirmPasswordCard({
    data,
    errors,
    processing,
    actionError,
    onPasswordChange,
    onSubmit,
}: SecurityConfirmPasswordCardProps) {
    return (
        <section
            aria-labelledby="security-confirm-title"
            className="grid min-w-0 gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
            data-test="security-confirm-card"
        >
            <SettingsCardHeading
                id="security-confirm-title"
                icon={LockKeyhole}
                title="Konfirmasi akses keamanan"
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
                    prefix="security-confirm"
                    errorHint={
                        Object.keys(errors).length > 0
                            ? 'Password yang dimasukkan tidak sesuai. Silakan coba lagi.'
                            : 'Konfirmasi ini memastikan perubahan pengaturan keamanan dilakukan oleh pemilik akun.'
                    }
                />
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="confirm_password" required>
                        Password saat ini
                    </Label>
                    <PasswordInput
                        id="confirm_password"
                        name="password"
                        disabled={processing}
                        value={data.password}
                        onChange={(event) =>
                            onPasswordChange(event.target.value)
                        }
                        className="h-11 bg-background/60 pr-12 [&+button]:w-11 [&+button]:justify-center"
                        autoComplete="current-password"
                        required
                        autoFocus
                        placeholder="Masukkan password saat ini"
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={
                            errors.password
                                ? 'confirm-password-help confirm-password-error'
                                : 'confirm-password-help'
                        }
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <p
                            id="confirm-password-help"
                            className="text-xs leading-normal text-muted-foreground"
                        >
                            Memastikan perubahan dilakukan oleh pemilik akun.
                        </p>
                        <InputError
                            id="confirm-password-error"
                            message={errors.password}
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                        type="submit"
                        disabled={processing}
                        className="min-h-10 w-full cursor-pointer justify-center px-6 sm:w-auto"
                        data-test="confirm-password-submit"
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
                </div>
            </form>
        </section>
    );
}
