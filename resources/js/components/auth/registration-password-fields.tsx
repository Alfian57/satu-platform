import { LockKeyhole, ShieldCheck } from 'lucide-react';
import AuthInputFrame from '@/components/auth/auth-input-frame';
import RequiredMark from '@/components/auth/required-mark';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Label } from '@/components/ui/label';

export interface RegistrationPasswordFieldsProps {
    passwordRules: string;
    errors: Record<string, string | undefined>;
}

export function RegistrationPasswordFields({
    passwordRules,
    errors,
}: RegistrationPasswordFieldsProps) {
    return (
        <>
            <div className="grid gap-1.5">
                <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                >
                    Password
                    <RequiredMark />
                </Label>
                <AuthInputFrame icon={LockKeyhole}>
                    <PasswordInput
                        id="password"
                        required
                        autoComplete="new-password"
                        name="password"
                        placeholder="Masukkan password"
                        passwordrules={passwordRules}
                        className="h-11 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={
                            errors.password
                                ? 'register-password-error'
                                : undefined
                        }
                    />
                </AuthInputFrame>
                <InputError
                    id="register-password-error"
                    message={errors.password}
                />
            </div>

            <div className="grid gap-1.5">
                <Label
                    htmlFor="password_confirmation"
                    className="text-sm font-semibold text-slate-700"
                >
                    Konfirmasi password
                    <RequiredMark />
                </Label>
                <AuthInputFrame icon={ShieldCheck}>
                    <PasswordInput
                        id="password_confirmation"
                        required
                        autoComplete="new-password"
                        name="password_confirmation"
                        placeholder="Ulangi password"
                        passwordrules={passwordRules}
                        className="h-11 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        aria-invalid={Boolean(errors.password_confirmation)}
                        aria-describedby={
                            errors.password_confirmation
                                ? 'register-password_confirmation-error'
                                : undefined
                        }
                    />
                </AuthInputFrame>
                <InputError
                    id="register-password_confirmation-error"
                    message={errors.password_confirmation}
                />
            </div>
        </>
    );
}
