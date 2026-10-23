import { Form } from '@inertiajs/react';
import { Smartphone, UserPlus, UserRound } from 'lucide-react';
import { ErrorSummary } from '@/components/common/error-summary';
import InputError from '@/components/common/input-error';
import TextLink from '@/components/common/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthInputFrame from '@/pages/auth/_components/auth-input-frame';
import RequiredMark from '@/pages/auth/_components/required-mark';
import { RegistrationPasswordFields } from '@/pages/auth/register/_components/registration-password-fields';
import { login } from '@/routes';
import { start } from '@/routes/register';

type Props = {
    passwordRules: string;
    status?: 'expired' | null;
};

export default function RegistrationDetailsStep({
    passwordRules,
    status,
}: Props) {
    return (
        <Form
            action={start.url()}
            method="post"
            resetOnSuccess={['password', 'password_confirmation']}
            disableWhileProcessing
            className="flex flex-col gap-4"
        >
            {({ processing, errors }) => (
                <>
                    <div data-test="register-error-summary">
                        <ErrorSummary
                            errors={errors}
                            title="Data belum dapat diproses"
                        />
                    </div>

                    <div className="auth-register-fields grid gap-4">
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="name"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Nama
                                <RequiredMark />
                            </Label>
                            <AuthInputFrame icon={UserRound}>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Masukkan nama lengkap"
                                    className="h-11 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    aria-invalid={Boolean(errors.name)}
                                    aria-describedby={
                                        errors.name
                                            ? 'register-name-error'
                                            : undefined
                                    }
                                />
                            </AuthInputFrame>
                            <InputError
                                id="register-name-error"
                                message={errors.name}
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="username"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Nama pengguna
                                <RequiredMark />
                            </Label>
                            <AuthInputFrame icon={UserRound}>
                                <Input
                                    id="username"
                                    type="text"
                                    required
                                    autoComplete="username"
                                    name="username"
                                    placeholder="Masukkan nama pengguna"
                                    aria-describedby={
                                        errors.username
                                            ? 'register-username-error'
                                            : undefined
                                    }
                                    className="h-11 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    aria-invalid={Boolean(errors.username)}
                                />
                            </AuthInputFrame>
                            <InputError
                                id="register-username-error"
                                message={errors.username}
                            />
                        </div>

                        <div className="grid min-w-0 gap-1.5">
                            <Label
                                htmlFor="phone"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Nomor WhatsApp
                                <RequiredMark />
                            </Label>
                            <AuthInputFrame icon={Smartphone}>
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
                                    className="h-11 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    aria-invalid={Boolean(errors.phone)}
                                />
                            </AuthInputFrame>
                            <div className="grid min-w-0 gap-0.5">
                                <p
                                    id="register-phone-help"
                                    className="text-xs leading-normal text-slate-500"
                                >
                                    Untuk verifikasi. Nomor disamarkan setelah
                                    dikirim.
                                </p>
                                <InputError
                                    id="register-phone-error"
                                    message={errors.phone}
                                />
                            </div>
                        </div>

                        <RegistrationPasswordFields
                            passwordRules={passwordRules}
                            errors={errors}
                        />

                        <div className="grid gap-2">
                            <div className="flex items-start gap-2.5 pt-1">
                                <input
                                    id="terms_accepted"
                                    type="checkbox"
                                    name="terms_accepted"
                                    required
                                    aria-invalid={Boolean(
                                        errors.terms_accepted,
                                    )}
                                    aria-describedby={
                                        errors.terms_accepted
                                            ? 'register-terms-error'
                                            : undefined
                                    }
                                    className="mt-0.5 size-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label
                                    htmlFor="terms_accepted"
                                    className="cursor-pointer text-xs leading-relaxed font-normal text-slate-600"
                                >
                                    Saya menyetujui Ketentuan Layanan dan
                                    Kebijakan Privasi SATU v1.0.
                                    <RequiredMark />
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
                            className="auth-submit-static h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-base font-semibold text-white shadow-md shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
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

                    {status === 'expired' && (
                        <p
                            role="status"
                            className="rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 text-sm text-amber-700"
                        >
                            Sesi verifikasi sudah berakhir. Data yang aman dapat
                            dimasukkan kembali untuk meminta kode baru.
                        </p>
                    )}

                    <div className="border-t border-slate-100 pt-3.5 text-center text-base text-slate-600 sm:text-[17px]">
                        Sudah punya akun?{' '}
                        <TextLink
                            href={login()}
                            className="ml-1.5 inline-flex min-h-11 cursor-pointer items-center font-bold text-blue-600 no-underline hover:text-blue-700 hover:underline"
                        >
                            Masuk
                        </TextLink>
                    </div>
                </>
            )}
        </Form>
    );
}
