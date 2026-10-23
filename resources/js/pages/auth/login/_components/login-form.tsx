import { Form } from '@inertiajs/react';
import { LockKeyhole, LogIn, UserRound } from 'lucide-react';
import InputError from '@/components/common/input-error';
import PasswordInput from '@/components/common/password-input';
import TextLink from '@/components/common/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthInputFrame from '@/pages/auth/_components/auth-input-frame';
import { recover, register } from '@/routes';
import { store } from '@/routes/login';

export default function LoginForm() {
    return (
        <Form
            action={store.url()}
            method="post"
            resetOnSuccess={['password']}
            className="flex flex-col gap-6"
        >
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label
                                htmlFor="username"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Nama pengguna
                            </Label>
                            <AuthInputFrame icon={UserRound}>
                                <Input
                                    id="username"
                                    type="text"
                                    name="username"
                                    required
                                    autoFocus
                                    autoComplete="username"
                                    placeholder="Masukkan nama pengguna"
                                    aria-describedby={
                                        errors.username
                                            ? 'username-help login-username-error'
                                            : 'username-help'
                                    }
                                    className="h-11 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    aria-invalid={Boolean(errors.username)}
                                />
                            </AuthInputFrame>
                            <p
                                id="username-help"
                                className="text-xs leading-relaxed text-slate-500"
                            >
                                Hanya untuk masuk, tidak tampil di profil
                                publik.
                            </p>
                            <InputError
                                id="login-username-error"
                                message={errors.username}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="password"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Password
                            </Label>
                            <AuthInputFrame icon={LockKeyhole}>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="current-password"
                                    placeholder="Masukkan password"
                                    className="h-11 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby={
                                        errors.password
                                            ? 'login-password-error'
                                            : undefined
                                    }
                                />
                            </AuthInputFrame>
                            <InputError
                                id="login-password-error"
                                message={errors.password}
                            />
                        </div>

                        <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3">
                            <div className="flex items-center space-x-2.5">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    className="cursor-pointer"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="inline-flex min-h-11 cursor-pointer items-center text-sm text-slate-600"
                                >
                                    Ingat saya
                                </Label>
                            </div>
                            <TextLink
                                href={recover()}
                                className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-600 no-underline hover:text-blue-700 hover:underline"
                                data-test="forgot-password-link"
                            >
                                Lupa password?
                            </TextLink>
                        </div>

                        <Button
                            type="submit"
                            className="auth-submit-static h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-base font-semibold text-white shadow-md shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing ? (
                                <Spinner />
                            ) : (
                                <LogIn
                                    aria-hidden="true"
                                    className="mr-1.5 size-4"
                                />
                            )}
                            Masuk
                        </Button>
                    </div>

                    <div className="border-t border-slate-100 pt-3.5 text-center text-base text-slate-600 sm:text-[17px]">
                        Belum punya akun?{' '}
                        <TextLink
                            href={register()}
                            className="ml-1.5 inline-flex min-h-11 items-center font-bold text-blue-600 no-underline hover:text-blue-700 hover:underline"
                        >
                            Daftar sekarang
                        </TextLink>
                    </div>
                </>
            )}
        </Form>
    );
}
