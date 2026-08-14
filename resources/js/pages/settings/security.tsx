import { Form, Head } from '@inertiajs/react';
import { KeyRound, Save } from 'lucide-react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
};

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Pengaturan keamanan" />

            <section
                aria-labelledby="security-settings-title"
                className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                data-test="security-settings-card"
            >
                <header className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                        <KeyRound aria-hidden="true" className="size-5" />
                    </span>
                    <div className="grid gap-1">
                        <h2
                            id="security-settings-title"
                            className="text-title font-bold tracking-[-0.02em] text-slate-950"
                        >
                            Password dan keamanan
                        </h2>
                        <p className="text-sm leading-6 text-slate-600">
                            Gunakan password yang panjang dan unik untuk menjaga
                            akunmu tetap aman.
                        </p>
                    </div>
                </header>
                <Form
                    action={SecurityController.update.url()}
                    method="put"
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    className="grid gap-5 border-t border-slate-100 pt-6"
                >
                    {({ errors, processing, recentlySuccessful }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="current_password">
                                    Password saat ini
                                </Label>

                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    name="current_password"
                                    className="w-full bg-slate-50"
                                    autoComplete="current-password"
                                    placeholder="Password saat ini"
                                />

                                <InputError message={errors.current_password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password baru</Label>

                                <PasswordInput
                                    id="password"
                                    ref={passwordInput}
                                    name="password"
                                    className="w-full bg-slate-50"
                                    autoComplete="new-password"
                                    placeholder="Password baru"
                                    passwordrules={props.passwordRules}
                                />

                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Konfirmasi password
                                </Label>

                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    className="w-full bg-slate-50"
                                    autoComplete="new-password"
                                    placeholder="Konfirmasi password"
                                    passwordrules={props.passwordRules}
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    disabled={processing}
                                    className="cursor-pointer disabled:cursor-not-allowed"
                                    data-test="update-password-button"
                                >
                                    {processing ? null : (
                                        <Save aria-hidden="true" />
                                    )}
                                    {processing
                                        ? 'Memperbarui password'
                                        : 'Perbarui password'}
                                </Button>
                                {recentlySuccessful && (
                                    <p
                                        role="status"
                                        className="text-sm font-medium text-verified"
                                    >
                                        Password sudah diperbarui.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </Form>
            </section>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan keamanan',
            href: edit(),
        },
    ],
};
